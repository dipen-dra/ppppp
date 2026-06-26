/**
 * @file controllers/user/bookingController.js
 * @description Controller for user-facing booking operations.
 *
 * Price Integrity Guarantee:
 *   ALL prices (totalCost, pickupDropoffCost, finalAmount) are computed
 *   SERVER-SIDE from DB records only. The frontend never sends a price.
 *   Any price field in the request body is silently ignored.
 */

const Booking  = require('../../models/Booking');
const Service  = require('../../models/Service');
const User     = require('../../models/User');
const Workshop = require('../../models/Workshop');
const axios    = require('axios');
const sendEmail = require('../../utils/sendEmail');
const { logAudit } = require('../../middlewares/auditLogger');
const mongoose = require('mongoose');

const SUCCESS_ICON_URL = 'https://cdn.vectorstock.com/i/500p/20/36/3d-green-check-icon-tick-mark-symbol-vector-56142036.jpg';

// ── Constants ─────────────────────────────────────────────────────────────────
const LOYALTY_DISCOUNT_RATE     = 0.20;   // 20% discount
const LOYALTY_POINTS_COST       = 100;    // points required to redeem
const KHALTI_VERIFY_URL         = 'https://khalti.com/api/v2/payment/verify/';
const MAX_NOTES_LENGTH          = 500;
const MAX_ADDRESS_LENGTH        = 300;
const MAX_BIKE_MODEL_LENGTH     = 100;
const BOOKING_DAYS_ADVANCE_MAX  = 90;     // can't book more than 90 days ahead
const PRICE_BOUNDS              = { min: 0, max: 500000 }; // sanity bound on prices in NPR

// ── Input sanitizers ──────────────────────────────────────────────────────────
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const sanitizeText = (str, maxLen) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>'"`;|&${}\\]/g, '').trim().slice(0, maxLen);
};

const validateBookingDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { valid: false, msg: 'Invalid date format.' };
    const now  = new Date();
    now.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + BOOKING_DAYS_ADVANCE_MAX);
    if (date < now)     return { valid: false, msg: 'Booking date cannot be in the past.' };
    if (date > maxDate) return { valid: false, msg: `Booking date cannot be more than ${BOOKING_DAYS_ADVANCE_MAX} days in advance.` };
    return { valid: true };
};

const validateCoordinates = (coords) => {
    if (!coords || typeof coords !== 'object') return false;
    const lat = parseFloat(coords.lat);
    const lng = parseFloat(coords.lng);
    return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

// ── Haversine distance (km) — replaces Math.random() hack ─────────────────────
const haversineDistance = (coord1, coord2) => {
    const R    = 6371; // Earth radius in km
    const toRad = (deg) => deg * (Math.PI / 180);
    const dLat  = toRad(coord2.lat - coord1.lat);
    const dLon  = toRad(coord2.lng - coord1.lng);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
              Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
};

// ── Loyalty points award ──────────────────────────────────────────────────────
const awardLoyaltyPoints = async (userId) => {
    const user = await User.findById(userId);
    if (user) {
        const pointsToAdd = Math.floor(Math.random() * 11) + 10;
        user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsToAdd;
        await user.save();
        return pointsToAdd;
    }
    return 0;
};

// ══════════════════════════════════════════════════════════════════════════════
// GET USER BOOKINGS
// ══════════════════════════════════════════════════════════════════════════════
const getUserBookings = async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 11));
        const skip  = (page - 1) * limit;

        const query = { customer: req.user._id };
        const totalItems = await Booking.countDocuments(query);
        const bookings   = await Booking.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);

        res.json({ success: true, data: bookings, totalPages: Math.ceil(totalItems / limit), currentPage: page });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getUserBookingById = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid booking ID.' });
        }
        // IDOR protection: filter by customer = logged-in user
        const booking = await Booking.findOne({ _id: req.params.id, customer: req.user._id });
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found or not authorized.' });
        res.json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getPendingBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({
            customer: req.user._id,
            paymentStatus: 'Pending',
            status: { $ne: 'Cancelled' }
        }).sort({ createdAt: -1 });
        res.json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getBookingHistory = async (req, res) => {
    try {
        const bookings = await Booking.find({ customer: req.user._id, paymentStatus: 'Paid' }).sort({ createdAt: -1 });
        res.json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// CREATE BOOKING
// Price is ALWAYS fetched from DB. Frontend price values are ignored.
// ══════════════════════════════════════════════════════════════════════════════
const createBooking = async (req, res) => {
    const {
        serviceId,
        bikeModel,
        date,
        notes,
        requestedPickupDropoff,
        pickupAddress,
        dropoffAddress,
        pickupCoordinates,
        dropoffCoordinates
    } = req.body;

    // ── Input validation ───────────────────────────────────────────────────────
    if (!serviceId || !bikeModel || !date) {
        return res.status(400).json({ success: false, message: 'Please provide all required fields: Service, Bike Model, Date.' });
    }
    if (!isValidObjectId(serviceId)) {
        return res.status(400).json({ success: false, message: 'Invalid service ID.' });
    }

    const cleanBikeModel = sanitizeText(bikeModel, MAX_BIKE_MODEL_LENGTH);
    if (!cleanBikeModel) {
        return res.status(400).json({ success: false, message: 'Bike model is required and must not contain special characters.' });
    }

    const dateCheck = validateBookingDate(date);
    if (!dateCheck.valid) {
        return res.status(400).json({ success: false, message: dateCheck.msg });
    }

    const cleanNotes = sanitizeText(notes || '', MAX_NOTES_LENGTH);

    try {
        const user     = await User.findById(req.user._id);
        const service  = await Service.findById(serviceId);
        const workshop = await Workshop.findOne();

        if (!user)     return res.status(404).json({ success: false, message: 'User not found.' });
        if (!service)  return res.status(404).json({ success: false, message: 'Service not found.' });
        if (!workshop) return res.status(500).json({ success: false, message: 'Workshop profile not found.' });

        // ── Price computed entirely on server from DB ──────────────────────────
        let pickupDropoffDistance = 0;
        let pickupDropoffCost     = 0;
        let finalAmount           = service.price; // ← authoritative DB price

        if (requestedPickupDropoff && workshop.offerPickupDropoff) {
            // Validate addresses
            const cleanPickup   = sanitizeText(pickupAddress || '', MAX_ADDRESS_LENGTH);
            const cleanDropoff  = sanitizeText(dropoffAddress || '', MAX_ADDRESS_LENGTH);
            if (!cleanPickup || !cleanDropoff) {
                return res.status(400).json({ success: false, message: 'Pickup/Dropoff addresses are required.' });
            }
            if (!validateCoordinates(pickupCoordinates) || !validateCoordinates(dropoffCoordinates)) {
                return res.status(400).json({ success: false, message: 'Valid pickup/dropoff coordinates are required.' });
            }

            // ── Real distance (Haversine) — not random ──────────────────────────
            pickupDropoffDistance = haversineDistance(pickupCoordinates, dropoffCoordinates);
            const ratePerKm = parseFloat(workshop.pickupDropoffChargePerKm) || 0;
            pickupDropoffCost = parseFloat((pickupDropoffDistance * ratePerKm).toFixed(2));
            finalAmount = parseFloat((service.price + pickupDropoffCost).toFixed(2));

            // Sanity bound
            if (finalAmount < PRICE_BOUNDS.min || finalAmount > PRICE_BOUNDS.max) {
                return res.status(400).json({ success: false, message: 'Calculated price is out of acceptable range.' });
            }
        } else if (requestedPickupDropoff && !workshop.offerPickupDropoff) {
            return res.status(400).json({ success: false, message: 'Pickup/Dropoff service is not offered by this workshop.' });
        }

        const booking = new Booking({
            customer:              user._id,
            customerName:          user.fullName,
            serviceType:           service.name,
            service:               service._id,
            bikeModel:             cleanBikeModel,
            date:                  new Date(date),
            notes:                 cleanNotes,
            totalCost:             service.price,      // ← from DB
            finalAmount,                               // ← server-computed
            status:                'Pending',
            paymentStatus:         'Pending',
            isPaid:                false,
            requestedPickupDropoff: !!requestedPickupDropoff,
            pickupAddress:         requestedPickupDropoff ? sanitizeText(pickupAddress, MAX_ADDRESS_LENGTH) : '',
            dropoffAddress:        requestedPickupDropoff ? sanitizeText(dropoffAddress, MAX_ADDRESS_LENGTH) : '',
            pickupCoordinates:     requestedPickupDropoff ? pickupCoordinates : undefined,
            dropoffCoordinates:    requestedPickupDropoff ? dropoffCoordinates : undefined,
            pickupDropoffDistance: pickupDropoffDistance,
            pickupDropoffCost:     pickupDropoffCost,
        });

        await booking.save();

        await logAudit('booking_created', {
            userId: user._id, userEmail: user.email, req, status: 'success',
            metadata: { bookingId: booking._id, service: service.name, finalAmount }
        });

        res.status(201).json({ success: true, data: booking, message: 'Booking created. Please complete payment.' });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// UPDATE BOOKING (user can only change service/date/notes/pickup details)
// Price is ALWAYS re-derived from DB on update.
// ══════════════════════════════════════════════════════════════════════════════
const updateUserBooking = async (req, res) => {
    try {
        const {
            serviceId,
            bikeModel,
            date,
            notes,
            requestedPickupDropoff,
            pickupAddress,
            dropoffAddress,
            pickupCoordinates,
            dropoffCoordinates
        } = req.body;

        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid booking ID.' });
        }

        const booking  = await Booking.findById(req.params.id);
        const workshop = await Workshop.findOne();

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

        // IDOR protection
        if (booking.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
        if (booking.status !== 'Pending' || booking.isPaid || booking.discountApplied) {
            return res.status(400).json({ success: false, message: 'Cannot edit a booking that is in progress, paid, or has a discount applied.' });
        }
        if (!workshop) return res.status(500).json({ success: false, message: 'Workshop profile not found.' });

        // ── Date validation ────────────────────────────────────────────────────
        if (date) {
            const dateCheck = validateBookingDate(date);
            if (!dateCheck.valid) return res.status(400).json({ success: false, message: dateCheck.msg });
            booking.date = new Date(date);
        }

        // ── Bike model & notes ─────────────────────────────────────────────────
        if (bikeModel !== undefined) {
            const cleanBike = sanitizeText(bikeModel, MAX_BIKE_MODEL_LENGTH);
            if (!cleanBike) return res.status(400).json({ success: false, message: 'Bike model contains invalid characters.' });
            booking.bikeModel = cleanBike;
        }
        if (notes !== undefined) {
            booking.notes = sanitizeText(notes, MAX_NOTES_LENGTH);
        }

        // ── Service change → re-fetch price from DB ────────────────────────────
        if (serviceId && serviceId !== booking.service.toString()) {
            if (!isValidObjectId(serviceId)) {
                return res.status(400).json({ success: false, message: 'Invalid service ID.' });
            }
            const service = await Service.findById(serviceId);
            if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
            booking.service     = service._id;
            booking.serviceType = service.name;
            booking.totalCost   = service.price;  // ← price from DB, not from request
        }

        // ── Pickup/dropoff recalculation ──────────────────────────────────────
        if (requestedPickupDropoff !== undefined) {
            if (requestedPickupDropoff && workshop.offerPickupDropoff) {
                const cleanPickup  = sanitizeText(pickupAddress || '', MAX_ADDRESS_LENGTH);
                const cleanDropoff = sanitizeText(dropoffAddress || '', MAX_ADDRESS_LENGTH);
                if (!cleanPickup || !cleanDropoff) {
                    return res.status(400).json({ success: false, message: 'Pickup/Dropoff addresses are required.' });
                }
                if (!validateCoordinates(pickupCoordinates) || !validateCoordinates(dropoffCoordinates)) {
                    return res.status(400).json({ success: false, message: 'Valid coordinates are required.' });
                }
                const dist = haversineDistance(pickupCoordinates, dropoffCoordinates);
                const cost = parseFloat((dist * (parseFloat(workshop.pickupDropoffChargePerKm) || 0)).toFixed(2));
                booking.requestedPickupDropoff  = true;
                booking.pickupAddress           = cleanPickup;
                booking.dropoffAddress          = cleanDropoff;
                booking.pickupCoordinates       = pickupCoordinates;
                booking.dropoffCoordinates      = dropoffCoordinates;
                booking.pickupDropoffDistance   = dist;
                booking.pickupDropoffCost       = cost;
            } else if (requestedPickupDropoff && !workshop.offerPickupDropoff) {
                return res.status(400).json({ success: false, message: 'Pickup/Dropoff service is not offered.' });
            } else {
                // Removing pickup/dropoff
                booking.requestedPickupDropoff  = false;
                booking.pickupAddress           = '';
                booking.dropoffAddress          = '';
                booking.pickupCoordinates       = undefined;
                booking.dropoffCoordinates      = undefined;
                booking.pickupDropoffDistance   = 0;
                booking.pickupDropoffCost       = 0;
            }
        }

        // ── Recalculate final amount server-side ───────────────────────────────
        const subtotal = booking.totalCost + (booking.pickupDropoffCost || 0);
        if (booking.discountApplied) {
            const discountVal       = parseFloat((subtotal * LOYALTY_DISCOUNT_RATE).toFixed(2));
            booking.discountAmount  = discountVal;
            booking.finalAmount     = parseFloat((subtotal - discountVal).toFixed(2));
        } else {
            booking.finalAmount     = parseFloat(subtotal.toFixed(2));
        }

        await booking.save();

        await logAudit('booking_updated', {
            userId: req.user._id, userEmail: req.user.email, req, status: 'success',
            metadata: { bookingId: booking._id, finalAmount: booking.finalAmount }
        });

        res.json({ success: true, data: booking, message: 'Booking updated successfully.' });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ success: false, message: 'Server error while updating booking.' });
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// DELETE / CANCEL BOOKING
// ══════════════════════════════════════════════════════════════════════════════
const deleteUserBooking = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid booking ID.' });
        }

        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

        // IDOR protection
        if (booking.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
        if (booking.isPaid) {
            return res.status(400).json({ success: false, message: 'Cannot cancel a paid booking.' });
        }

        // Refund loyalty points if discount was used
        if (booking.discountApplied) {
            const user = await User.findById(req.user._id);
            if (user) {
                user.loyaltyPoints += LOYALTY_POINTS_COST;
                await user.save();
            }
        }

        await booking.deleteOne();
        res.json({ success: true, message: 'Booking cancelled. Any used loyalty points have been refunded.' });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// CONFIRM PAYMENT — COD only
// Amount is read from DB; frontend cannot inject a price here.
// ══════════════════════════════════════════════════════════════════════════════
const confirmPayment = async (req, res) => {
    const { paymentMethod } = req.body;

    if (paymentMethod !== 'COD') {
        return res.status(400).json({ success: false, message: 'This route is only for COD payments.' });
    }

    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid booking ID.' });
        }

        const booking = await Booking.findById(req.params.id).populate('customer', 'fullName email');
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

        // IDOR protection
        if (booking.customer._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
        if (booking.isPaid) {
            return res.status(400).json({ success: false, message: 'Booking is already paid.' });
        }

        const points = await awardLoyaltyPoints(req.user._id);

        booking.paymentMethod  = 'COD';
        booking.paymentStatus  = 'Paid';
        booking.isPaid         = true;
        booking.pointsAwarded  = points;
        await booking.save();

        await logAudit('booking_updated', {
            userId: req.user._id, userEmail: req.user.email, req, status: 'success',
            metadata: { bookingId: booking._id, paymentMethod: 'COD', finalAmount: booking.finalAmount }
        });

        res.status(200).json({ success: true, data: booking, message: `Payment confirmed! You've earned ${points} loyalty points.` });

        try {
            const emailHtml = `<div style="font-family:Arial,sans-serif;padding:20px;">
                <h2>Booking Confirmed!</h2>
                <p>Dear ${booking.customer.fullName},</p>
                <p>Booking <strong>#${booking._id}</strong> for <strong>${booking.serviceType}</strong> is confirmed.</p>
                <p>You earned <strong>${points} loyalty points</strong>!</p>
                <p>Pay <strong>Rs. ${booking.finalAmount}</strong> on service completion.</p>
            </div>`;
            await sendEmail(booking.customer.email, 'Your MotoFix Booking is Confirmed!', emailHtml);
        } catch (emailError) {
            console.error('Error sending COD email:', emailError);
        }
    } catch (error) {
        console.error(error);
        if (!res.headersSent) res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// VERIFY KHALTI PAYMENT
// CRITICAL: expected amount is taken from DB ONLY — frontend amount ignored.
// ══════════════════════════════════════════════════════════════════════════════
const verifyKhaltiPayment = async (req, res) => {
    const { token, booking_id } = req.body;  // ← Note: `amount` from frontend is IGNORED

    if (!token || !booking_id) {
        return res.status(400).json({ success: false, message: 'Missing token or booking ID.' });
    }
    if (!isValidObjectId(booking_id)) {
        return res.status(400).json({ success: false, message: 'Invalid booking ID.' });
    }

    try {
        const booking = await Booking.findById(booking_id).populate('customer', 'fullName email');
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

        // IDOR protection
        if (booking.customer._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
        if (booking.isPaid) {
            return res.status(400).json({ success: false, message: 'Booking is already paid.' });
        }

        // ── Expected amount derived from DB only ───────────────────────────────
        const expectedAmountPaisa = Math.round(booking.finalAmount * 100);

        // Send DB-derived amount to Khalti API — NOT the frontend-supplied amount
        const khaltiResponse = await axios.post(
            KHALTI_VERIFY_URL,
            { token, amount: expectedAmountPaisa },  // ← authoritative DB value
            { headers: { 'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}` } }
        );

        if (khaltiResponse.data?.idx) {
            // Double-check: if Khalti returns amount, validate it matches DB
            if (khaltiResponse.data.amount !== undefined &&
                parseInt(khaltiResponse.data.amount) !== expectedAmountPaisa) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment tampering detected: Khalti verified amount does not match booking amount.'
                });
            }

            const points = await awardLoyaltyPoints(req.user._id);

            booking.paymentMethod = 'Khalti';
            booking.paymentStatus = 'Paid';
            booking.isPaid        = true;
            booking.pointsAwarded = points;
            await booking.save();

            await logAudit('booking_updated', {
                userId: req.user._id, userEmail: req.user.email, req, status: 'success',
                metadata: { bookingId: booking._id, paymentMethod: 'Khalti', finalAmount: booking.finalAmount }
            });

            res.status(200).json({ success: true, message: `Payment successful! You've earned ${points} loyalty points.` });

            try {
                const emailHtml = `<div style="font-family:Arial,sans-serif;padding:20px;">
                    <h2 style="color:#27ae60;">Payment Successful!</h2>
                    <p>Dear ${booking.customer.fullName},</p>
                    <p>Payment for booking <strong>#${booking._id}</strong> processed via Khalti.</p>
                    <p>You earned <strong>${points} loyalty points</strong>!</p>
                    <p>Total Paid: <strong>Rs. ${booking.finalAmount}</strong></p>
                </div>`;
                await sendEmail(booking.customer.email, 'Your MotoFix Booking is Confirmed!', emailHtml);
            } catch (emailError) {
                console.error('Error sending Khalti email:', emailError);
            }
        } else {
            return res.status(400).json({ success: false, message: 'Khalti payment verification failed.' });
        }
    } catch (error) {
        console.error('Khalti error:', error.response?.data || error.message);
        if (!res.headersSent) res.status(500).json({ success: false, message: 'Server error during Khalti verification.' });
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// APPLY LOYALTY DISCOUNT
// Discount rate is a server-side constant. Frontend cannot supply a discount %.
// ══════════════════════════════════════════════════════════════════════════════
const applyLoyaltyDiscount = async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid booking ID.' });
    }

    try {
        // Use findOneAndUpdate with $set to prevent race conditions on double-spend
        const booking = await Booking.findOneAndUpdate(
            {
                _id:              req.params.id,
                customer:         req.user._id, // IDOR protection built-in
                isPaid:           false,
                discountApplied:  false         // idempotency: won't apply twice
            },
            { $set: { discountApplied: true } }, // mark atomically before computing
            { new: false }                        // get the OLD doc to check points
        );

        if (!booking) {
            return res.status(400).json({
                success: false,
                message: 'Booking not found, already paid, discount already applied, or not authorized.'
            });
        }

        // Check user loyalty points (re-fetch for fresh value)
        const user = await User.findById(req.user._id);
        if (!user || user.loyaltyPoints < LOYALTY_POINTS_COST) {
            // Rollback the discountApplied flag we set atomically above
            await Booking.findByIdAndUpdate(req.params.id, { $set: { discountApplied: false } });
            return res.status(400).json({
                success: false,
                message: `Not enough loyalty points. You need at least ${LOYALTY_POINTS_COST}.`
            });
        }

        // ── Compute discount entirely server-side ──────────────────────────────
        const subtotal      = booking.totalCost + (booking.pickupDropoffCost || 0);
        const discountVal   = parseFloat((subtotal * LOYALTY_DISCOUNT_RATE).toFixed(2));
        const newFinal      = parseFloat((subtotal - discountVal).toFixed(2));

        // Update booking with computed values
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    discountApplied: true,
                    discountAmount:  discountVal,
                    finalAmount:     newFinal
                }
            },
            { new: true }
        );

        // Deduct loyalty points
        user.loyaltyPoints -= LOYALTY_POINTS_COST;
        await user.save();

        res.status(200).json({
            success: true,
            message: `${LOYALTY_DISCOUNT_RATE * 100}% discount applied! New total: Rs. ${newFinal}.`,
            data: { booking: updatedBooking, loyaltyPoints: user.loyaltyPoints }
        });

    } catch (error) {
        console.error('Error applying discount:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getUserBookings,
    createBooking,
    updateUserBooking,
    deleteUserBooking,
    confirmPayment,
    verifyKhaltiPayment,
    applyLoyaltyDiscount,
    getUserBookingById,
    getPendingBookings,
    getBookingHistory
};