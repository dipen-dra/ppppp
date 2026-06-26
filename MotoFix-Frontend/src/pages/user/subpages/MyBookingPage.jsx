import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, Bike } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiFetchUser } from '../../../services/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import StatusBadge from '../../../components/ui/Statusbadge';

const UserBookingsPage = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [bookingToDelete, setBookingToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const fetchBookings = async (page) => {
        setIsLoading(true);
        try {
            const response = await apiFetchUser(`/bookings?page=${page}&limit=10`);
            const data = await response.json();
            setBookings(data.data || []);
            setTotalPages(data.totalPages || 0);
        } catch (error) {
            toast.error(error.message || 'Failed to fetch your bookings.');
            setBookings([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings(currentPage);
    }, [currentPage]);

    const handleDelete = async () => {
        if (!bookingToDelete) return;
        try {
            await apiFetchUser(`/bookings/${bookingToDelete}`, { method: 'DELETE' });
            toast.success('Booking cancelled successfully.');
            setBookingToDelete(null);
            fetchBookings(currentPage); // Refresh the list
        } catch (error) {
            toast.error(error.message || "Failed to cancel booking.");
        }
    };

    return (
        <div className="space-y-8 flex flex-col flex-grow max-w-7xl mx-auto w-full">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/08 pb-5">
                <div>
                    <h1 className="text-3xl font-black text-[#111118] tracking-tight">
                        My Bookings
                    </h1>
                    <p className="text-sm text-[#4A4A65] mt-1">
                        Track active workshops, check pick-up schedules, and view service invoices.
                    </p>
                </div>
                <Button 
                    onClick={() => navigate('/user/new-booking')} 
                    className="shrink-0 h-11 !px-5 text-sm font-semibold text-[#0D0D14] bg-gradient-to-r from-[#F5C000] to-[#E6B000] shadow-[0_4px_16px_rgba(245,192,0,0.3)] hover:shadow-[0_6px_24px_rgba(245,192,0,0.45)] hover:-translate-y-0.5 transition-all duration-200"
                >
                    <PlusCircle size={16} /> New Booking
                </Button>
            </div>

            <Card className="flex flex-col flex-grow rounded-2xl border border-black/08 p-0 overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto flex-grow">
                    {isLoading ? (
                        <div className="text-center py-16 text-[#8A8AA8]">Loading your bookings...</div>
                    ) : bookings.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-black/08 text-xs font-bold text-[#8A8AA8] uppercase tracking-wider bg-[#FDFDF8]">
                                    <th className="py-4 px-5">Service Category</th>
                                    <th className="py-4 px-5">Bike Model</th>
                                    <th className="py-4 px-5">Scheduled Date</th>
                                    <th className="py-4 px-5">Workshop Status</th>
                                    <th className="py-4 px-5">Payment Status</th>
                                    <th className="py-4 px-5 text-right">Invoice Cost</th>
                                    <th className="py-4 px-5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/05">
                                {bookings.map(booking => (
                                    <tr key={booking._id} className="hover:bg-[#FDFDF8] transition-colors">
                                        <td className="py-4 px-5 font-bold text-sm text-[#111118]">{booking.serviceType}</td>
                                        <td className="py-4 px-5 text-[#4A4A65] text-sm">{booking.bikeModel}</td>
                                        <td className="py-4 px-5 text-[#4A4A65] text-sm">{new Date(booking.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                        <td className="py-4 px-5 text-sm"><StatusBadge status={booking.status} /></td>
                                        <td className="py-4 px-5 text-sm"><StatusBadge status={booking.paymentStatus} /></td>
                                        <td className="py-4 px-5 text-right font-bold text-sm text-[#111118]">
                                            {booking.discountApplied && (
                                                <span className="text-xs text-red-500 line-through mr-1.5">रु{booking.totalCost}</span>
                                            )}
                                            रु{booking.finalAmount ?? booking.totalCost}
                                        </td>
                                        <td className="py-4 px-5 text-center">
                                            <div className="flex justify-center gap-1.5">
                                                <Button 
                                                    variant="secondary" 
                                                    className="!p-2 rounded-lg !bg-[#F5F3E7] hover:!bg-[#F5C000] text-[#111118]" 
                                                    onClick={() => navigate(`/user/edit-booking/${booking._id}`)} 
                                                    disabled={booking.status !== 'Pending' || booking.isPaid || booking.discountApplied}
                                                    title="Edit Booking"
                                                >
                                                    <Edit size={14} />
                                                </Button>
                                                <Button 
                                                    variant="danger" 
                                                    className="!p-2 rounded-lg" 
                                                    onClick={() => setBookingToDelete(booking._id)} 
                                                    disabled={booking.isPaid}
                                                    title="Cancel Booking"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-20 bg-white">
                            <Bike size={40} className="mx-auto text-[#8A8AA8] mb-4" />
                            <h3 className="text-lg font-black text-[#111118]">No Bookings Scheduled</h3>
                            <p className="text-sm text-[#4A4A65] mt-1.5">You haven't scheduled any services yet.</p>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-black/08 bg-[#FDFDF8]">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            </Card>
            <ConfirmationModal isOpen={!!bookingToDelete} onClose={() => setBookingToDelete(null)} onConfirm={handleDelete} title="Cancel Booking" message="Are you sure you want to cancel this booking? This action cannot be undone." confirmText="Yes, Cancel" />
        </div>
    );
};

export default UserBookingsPage;