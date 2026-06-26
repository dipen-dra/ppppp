import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Gift, CreditCard, Sparkles, CheckCircle2 } from 'lucide-react';
import { apiFetchUser } from '../../../services/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import LoadMoreControl from '../../../components/ui/LoadMoreControl';
import StatusBadge from '../../../components/ui/Statusbadge';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

const MyPaymentsPage = ({ loyaltyPoints, onDiscountApplied }) => {
    const [unpaidBookings, setUnpaidBookings] = useState([]);
    const [paidBookings, setPaidBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAllHistory, setShowAllHistory] = useState(false);
    const [pendingPaymentConfirm, setPendingPaymentConfirm] = useState(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [pendingRes, historyRes] = await Promise.all([
                apiFetchUser('/bookings/pending'),
                apiFetchUser('/bookings/history')
            ]);
            const pendingData = await pendingRes.json();
            const historyData = await historyRes.json();
            setUnpaidBookings(pendingData.data || []);
            setPaidBookings(historyData.data || []);
        } catch (error) {
            toast.error(error.message || 'Could not fetch your payment information.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');
        const message = params.get('message');

        if (status && message) {
            if (status === 'success') {
                toast.success(message);
            } else {
                toast.error(message);
            }
            window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        }
    }, []);

    const handleSuccessfulPayment = async () => {
        await fetchData();
        onDiscountApplied();
    };

    const handleApplyDiscount = async (bookingId) => {
        try {
            const response = await apiFetchUser(`/bookings/${bookingId}/apply-discount`, { method: 'PUT' });
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || "Failed to apply discount.");
            }
            
            toast.success(data.message || 'Discount applied successfully!');
            handleSuccessfulPayment();
        } catch (error) {
            toast.error(error.message || "Failed to apply discount.");
        }
    };

    const confirmPaymentAction = () => {
        if (!pendingPaymentConfirm) return;
        const { booking, method } = pendingPaymentConfirm;
        setPendingPaymentConfirm(null);
        handlePayment(booking, method);
    };

    const handlePayment = async (booking, method) => {
        const amountToPay = booking.finalAmount ?? booking.totalCost;

        if (method === 'COD') {
            try {
                const response = await apiFetchUser(`/bookings/${booking._id}/pay`, {
                    method: 'PUT',
                    body: JSON.stringify({ paymentMethod: 'COD' })
                });
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || "COD confirmation failed.");
                }
                
                toast.success("COD Payment Confirmed! Your booking is being processed.");
                handleSuccessfulPayment();
            } catch (error) {
                toast.error(error.message || "COD confirmation failed.");
            }
            return;
        }

        if (method === 'eSewa') {
            try {
                const response = await fetch('http://localhost:5050/api/payment/esewa/initiate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ bookingId: booking._id }),
                });

                if (!response.ok) throw new Error('eSewa initiation failed.');

                const esewaResponse = await response.json();
                const form = document.createElement('form');
                form.setAttribute('method', 'POST');
                form.setAttribute('action', esewaResponse.ESEWA_URL);

                for (const key in esewaResponse) {
                    if (key !== 'ESEWA_URL') {
                        const hiddenField = document.createElement('input');
                        hiddenField.setAttribute('type', 'hidden');
                        hiddenField.setAttribute('name', key);
                        hiddenField.setAttribute('value', esewaResponse[key]);
                        form.appendChild(hiddenField);
                    }
                }
                document.body.appendChild(form);
                form.submit();
            } catch (error) {
                toast.error(error.message || 'Error initiating eSewa payment.');
            }
            return;
        }

        if (method === 'Khalti') {
            const khaltiConfig = {
                publicKey: "test_public_key_dc74e0fd57cb46cd93832aee0a390234",
                productIdentity: booking._id,
                productName: booking.serviceType,
                productUrl: window.location.href,
                eventHandler: {
                    async onSuccess(payload) {
                        try {
                            const response = await apiFetchUser('/bookings/verify-khalti', {
                                method: 'POST',
                                body: JSON.stringify({
                                    token: payload.token,
                                    amount: payload.amount,
                                    booking_id: booking._id
                                })
                            });
                            
                            if (!response.ok) {
                                const errData = await response.json();
                                throw new Error(errData.message || 'Khalti payment verification failed.');
                            }
                            
                            toast.success('Khalti Payment Successful & Verified!');
                            handleSuccessfulPayment();
                        } catch (error) {
                            toast.error(error.message || 'Khalti payment verification failed.');
                        }
                    },
                    onError: () => toast.error('Khalti payment process was interrupted.'),
                    onClose: () => console.log('Khalti widget closed.'),
                },
                paymentPreference: ["KHALTI", "EBANKING", "MOBILE_BANKING", "CONNECT_IPS", "SCT"],
            };
            const checkout = new window.KhaltiCheckout(khaltiConfig);
            checkout.show({ amount: amountToPay * 100 });
        }
    };

    const displayedHistory = showAllHistory ? paidBookings : paidBookings.slice(0, 10);

    return (
        <div className="space-y-8 max-w-7xl mx-auto w-full text-[#111118]">
            {/* Header section */}
            <div className="border-b border-black/08 pb-5">
                <h1 className="text-3xl font-black tracking-tight">
                    Payments
                </h1>
                <p className="text-sm text-[#4A4A65] mt-1.5 max-w-xl">
                    Manage pending invoices, apply loyalty program points for 20% discounts, and view transaction history.
                </p>
            </div>

            {/* Main grid section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Side: Pending list */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-white border border-black/08 rounded-2xl p-6 relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#F5C000]" />

                        <div className="flex justify-between items-center border-b border-black/07 pb-4 mb-6">
                            <h2 className="text-base font-bold text-[#111118] uppercase tracking-wider flex items-center gap-2">
                                <CreditCard size={18} className="text-[#B8860B]" />
                                Unsettled Invoices
                            </h2>
                            <span className="text-xs text-[#8A8AA8] font-semibold">
                                Awaiting Payment ({unpaidBookings.length})
                            </span>
                        </div>

                        {isLoading && unpaidBookings.length === 0 ? (
                            <div className="flex flex-col justify-center items-center py-20 space-y-3">
                                <div className="w-8 h-8 border-4 border-[rgba(245,192,0,0.2)] border-t-[#F5C000] rounded-full animate-spin"></div>
                                <p className="text-xs text-[#8A8AA8] font-bold animate-pulse">Syncing Payment Ledger...</p>
                            </div>
                        ) : unpaidBookings.length > 0 ? (
                            <div className="space-y-4">
                                {unpaidBookings.map(booking => {
                                    const rawPrice = booking.totalCost;
                                    const logisticsPrice = booking.requestedPickupDropoff ? (booking.pickupDropoffCost || 350) : 0;
                                    const displayedTotal = booking.finalAmount ?? (rawPrice + logisticsPrice);
                                    
                                    return (
                                        <div 
                                            key={booking._id} 
                                            className="p-5 border border-black/08 hover:border-[#F5C000]/30 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-5 bg-[#FDFDF8] transition-all duration-205"
                                        >
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-sm text-[#111118]">
                                                    {booking.serviceType}
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-[#4A4A65]">
                                                    <p>Bike: <span className="font-semibold text-[#111118]">{booking.bikeModel}</span></p>
                                                    <p>Date: <span className="font-semibold">{new Date(booking.date).toLocaleDateString()}</span></p>
                                                </div>
                                                
                                                <div className="pt-2 flex items-baseline gap-2">
                                                    <span className="text-[10px] text-[#8A8AA8] font-bold uppercase tracking-wider">Total Invoice:</span>
                                                    {booking.discountApplied ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-[#8A8AA8] line-through">रु{booking.totalCost + logisticsPrice}</span>
                                                            <span className="text-sm font-bold text-green-600">रु{displayedTotal}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm font-bold text-[#B8860B]">रु{displayedTotal}</span>
                                                    )}
                                                </div>
                                                {booking.discountApplied && (
                                                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider flex items-center gap-1 mt-1">
                                                        <CheckCircle2 size={12} /> 20% Loyalty Deduction Applied (-रु{booking.discountAmount || 0})
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                                {loyaltyPoints >= 100 && !booking.discountApplied && (
                                                    <Button 
                                                        variant="special" 
                                                        onClick={() => handleApplyDiscount(booking._id)} 
                                                        className="!py-2 !px-4 text-xs font-semibold shrink-0 !bg-[#FDF2F8] hover:!bg-[#FCE7F3] !text-[#DB2777] border border-[#FBCFE8]"
                                                    >
                                                        Apply 20% Discount
                                                    </Button>
                                                )}
                                                <Button 
                                                    onClick={() => setPendingPaymentConfirm({ booking, method: 'COD' })} 
                                                    className="!py-2 !px-4 text-xs font-semibold shrink-0 !bg-[#F5F3E7] hover:!bg-[#E6B000] text-[#111118]"
                                                >
                                                    Cash On Delivery
                                                </Button>
                                                
                                                <button 
                                                    onClick={() => setPendingPaymentConfirm({ booking, method: 'Khalti' })} 
                                                    className="bg-[#FDFDF8] hover:bg-[#F5F3E7] border border-black/10 hover:border-[#F5C000]/40 p-2 rounded-xl flex items-center justify-center h-10 w-24 transition-colors shrink-0 cursor-pointer"
                                                    title="Pay with Khalti Wallet"
                                                >
                                                    <img src="/khaltilogo.png" alt="Khalti" className="h-5 object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span className="text-xs font-bold text-[#4C1D95]">KHALTI</span>'; }} />
                                                </button>
                                                <button 
                                                    onClick={() => setPendingPaymentConfirm({ booking, method: 'eSewa' })} 
                                                    className="bg-[#FDFDF8] hover:bg-[#F5F3E7] border border-black/10 hover:border-[#F5C000]/40 p-2 rounded-xl flex items-center justify-center h-10 w-24 transition-colors shrink-0 cursor-pointer"
                                                    title="Pay with eSewa Wallet"
                                                >
                                                    <img src="/esewa_logo.png" alt="eSewa" className="h-5 object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span className="text-xs font-bold text-[#15803D]">ESEWA</span>'; }} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16 space-y-3">
                                <CheckCircle2 size={44} className="mx-auto text-green-500/20" />
                                <h3 className="text-lg font-black text-[#111118]">All Settled</h3>
                                <p className="text-sm text-[#4A4A65] max-w-[240px] mx-auto leading-relaxed">
                                    No pending invoices found. All service tickets are fully cleared.
                                </p>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right Side: Loyalty board */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-white border border-black/08 rounded-2xl p-5 relative overflow-hidden text-left shadow-sm">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#F5C000]" />

                        <p className="text-[10px] text-[#8A8AA8] uppercase tracking-wider font-bold flex items-center gap-1.5 mb-2">
                            <Gift size={14} className="text-[#B8860B]" />
                            Loyalty Engine Metrics
                        </p>
                        
                        <div className="p-4 bg-[#FDFDF8] border border-black/08 rounded-xl text-center space-y-1 relative">
                            <p className="font-bold text-4xl text-[#111118]">
                                {loyaltyPoints}
                            </p>
                            <p className="text-[10px] text-[#B8860B] font-bold uppercase tracking-wider">
                                Fuel Points Balance
                            </p>
                        </div>

                        <div className="mt-4 p-4 bg-[#FFFCEE] rounded-xl border border-[#F5C000]/20 text-xs text-[#4A4A65] space-y-2">
                            <p className="font-bold text-[#B8860B] uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
                                <Sparkles size={12} />
                                HOW DO REWARDS WORK?
                            </p>
                            <p className="leading-relaxed">
                                Earn loyalty fuel points with every completed payment checkout. Once you reach <span className="font-bold text-[#B8860B]">100 points</span>, redeem them here to claim an instant <span className="font-bold text-green-600">20% discount</span> on your next service package.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Historical transaction archives */}
            <Card className="flex flex-col flex-grow bg-white border border-black/08 rounded-2xl p-0 overflow-hidden relative shadow-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#F5C000]" />

                <div className="p-6 border-b border-black/08">
                    <h2 className="text-lg font-black text-[#111118]">
                        Invoice Archives
                    </h2>
                    <p className="text-xs text-[#8A8AA8] mt-0.5">Audit log of your completed workshop payments, payments methods, and invoices.</p>
                </div>

                <div className="overflow-x-auto flex-grow">
                    {isLoading && paidBookings.length === 0 ? (
                        <div className="flex flex-col justify-center items-center py-20 space-y-3">
                            <div className="w-8 h-8 border-4 border-[rgba(245,192,0,0.2)] border-t-[#F5C000] rounded-full animate-spin"></div>
                            <p className="text-xs text-[#8A8AA8] font-bold animate-pulse">Syncing Payment Archives...</p>
                        </div>
                    ) : displayedHistory.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs font-bold text-[#8A8AA8] uppercase bg-[#FDFDF8] border-b border-black/08">
                                    <th className="py-4 px-5">Service Tier Package</th>
                                    <th className="py-4 px-5">Bike Configuration</th>
                                    <th className="py-4 px-5">Completion Date</th>
                                    <th className="py-4 px-5">Settled Amount</th>
                                    <th className="py-4 px-5">Settlement Method</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/05">
                                {displayedHistory.map(booking => {
                                    const logisticsPrice = booking.requestedPickupDropoff ? (booking.pickupDropoffCost || 350) : 0;
                                    const actualFinalAmount = booking.finalAmount ?? (booking.totalCost + logisticsPrice);
                                    
                                    return (
                                        <tr key={booking._id} className="hover:bg-[#FDFDF8] transition-colors">
                                            <td className="py-4 px-5 font-bold text-sm text-[#111118]">{booking.serviceType}</td>
                                            <td className="py-4 px-5 text-[#4A4A65] text-sm">{booking.bikeModel}</td>
                                            <td className="py-4 px-5 text-[#4A4A65] text-sm">{new Date(booking.date).toLocaleDateString()}</td>
                                            <td className="py-4 px-5 font-bold text-sm text-[#111118]">
                                                {booking.discountApplied && (
                                                    <span className="text-xs text-red-500 line-through mr-1.5">रु{booking.totalCost + logisticsPrice}</span>
                                                )}
                                                रु{actualFinalAmount}
                                            </td>
                                            <td className="py-4 px-5 text-sm">
                                                <StatusBadge status={booking.paymentMethod === 'Not Selected' ? 'COD' : booking.paymentMethod} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-16 text-[#8A8AA8] text-sm">
                            No transaction history found on this account.
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-black/08 bg-[#FDFDF8] flex justify-center">
                    <LoadMoreControl
                        onToggle={() => setShowAllHistory(!showAllHistory)}
                        isExpanded={showAllHistory}
                        hasMore={paidBookings.length > 10}
                    />
                </div>
            </Card>

            <ConfirmationModal
                isOpen={!!pendingPaymentConfirm}
                onClose={() => setPendingPaymentConfirm(null)}
                onConfirm={confirmPaymentAction}
                title="Confirm Checkout Route"
                message={`Are you sure you want to proceed with payment via ${pendingPaymentConfirm?.method} for this service booking (${pendingPaymentConfirm?.booking?.serviceType || 'Service'})?`}
                confirmText="Yes, Proceed"
                confirmButtonVariant="primary"
                Icon={CreditCard}
                iconColor="text-[#F5C000]"
                iconBgColor="bg-[#FFFCEE]"
            />
        </div>
    );
};

export default MyPaymentsPage;