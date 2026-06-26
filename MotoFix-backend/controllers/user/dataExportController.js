// controllers/user/dataExportController.js
/**
 * GDPR / Privacy — User Data Export
 * Aggregates all data belonging to the authenticated user and returns
 * a clean JSON export. Sensitive internal fields are scrubbed.
 */
const User    = require('../../models/User');
const { logAudit } = require('../../middlewares/auditLogger');

// Mongoose models we might need
let Booking, Payment;
try { Booking = require('../../models/Booking'); } catch (_) {}
try { Payment = require('../../models/Payment'); } catch (_) {}

exports.exportUserData = async (req, res) => {
    try {
        const userId = req.user._id;

        // ── Profile (strip all internal/security fields) ──────────────────────
        const userDoc = await User.findById(userId).select(
            'fullName email phone address profilePicture role loyaltyPoints createdAt'
        ).lean();

        if (!userDoc) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const exportData = {
            exportedAt: new Date().toISOString(),
            profile: userDoc,
            bookings: [],
            payments: []
        };

        // ── Bookings ──────────────────────────────────────────────────────────
        if (Booking) {
            const bookings = await Booking.find({ userId })
                .select('-__v')
                .lean();
            exportData.bookings = bookings;
        }

        // ── Payments ──────────────────────────────────────────────────────────
        if (Payment) {
            const payments = await Payment.find({ userId })
                .select('-__v')
                .lean();
            exportData.payments = payments;
        }

        await logAudit('data_exported', {
            userId,
            userEmail: req.user.email,
            req,
            status: 'success',
            metadata: {
                recordCounts: {
                    bookings: exportData.bookings.length,
                    payments: exportData.payments.length
                }
            }
        });

        // Return as downloadable JSON
        res.setHeader('Content-Disposition', `attachment; filename="motofix-data-export-${userId}.json"`);
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({
            success: true,
            message: 'Data export successful.',
            data: exportData
        });

    } catch (err) {
        console.error('Data Export Error:', err);
        return res.status(500).json({ success: false, message: 'Server error during data export.' });
    }
};
