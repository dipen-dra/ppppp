import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/api'; // Your configured Axios instance
import { MapPin } from 'lucide-react'; // Import the MapPin icon

const BookingDetails = () => {
    const { id } = useParams();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                // This API call now receives the address in the customer object
                const response = await api.get(`/admin/bookings/${id}`);
                setBooking(response.data.data);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-gray-500">Loading booking details...</p>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center mt-10">Error: {error}</div>;
    }

    if (!booking) {
        return <div className="text-center mt-10">Booking not found.</div>;
    }

    // Helper to determine status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 sm:p-8 max-w-4xl mx-auto">
                <div className="flex justify-between items-start mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                    <div>
                         <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Booking Details</h1>
                         <p className="text-sm text-gray-500 dark:text-gray-400">ID: {booking._id}</p>
                    </div>
                     <span className={`px-4 py-1.5 text-sm font-medium rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                    </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* User Information Section */}
                    <div>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">User Information</h2>
                        <div className="space-y-4 text-gray-600 dark:text-gray-300">
                            <p><strong>Name:</strong> {booking.customer?.fullName || 'N/A'}</p>
                            <p><strong>Email:</strong> {booking.customer?.email || 'N/A'}</p>
                            <p><strong>Phone:</strong> {booking.customer?.phone || 'N/A'}</p>
                            
                            {/* ---vvv UPDATED ADDRESS BLOCK vvv--- */}
                            <div className="pt-2">
                                <p className="mb-2">
                                    <strong className="text-gray-600 dark:text-gray-300">Address:</strong>
                                    <span className="block mt-1 text-gray-800 dark:text-gray-100">
                                        {booking.customer?.address || 'Not provided by user.'}
                                    </span>
                                </p>
                                {booking.customer?.address && (
                                    <a 
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.customer.address)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-md"
                                    >
                                        <MapPin size={16} />
                                        Get Directions
                                    </a>
                                )}
                            </div>
                            {/* ---^^^ END OF UPDATED BLOCK ^^^--- */}
                        </div>
                    </div>
                    {/* Booking Information Section */}
                    <div>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Booking Information</h2>
                        <div className="space-y-3 text-gray-600 dark:text-gray-300">
                            <p><strong>Service:</strong> {booking.serviceType || 'N/A'}</p>
                            <p><strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}</p>
                            <p><strong>Time:</strong> {booking.time || 'Not specified'}</p>
                            <p><strong>Total Cost:</strong> <span className="font-bold text-lg text-green-600 dark:text-green-400">रु{booking.totalCost}</span></p>
                            <p><strong>Booked On:</strong> {new Date(booking.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Vehicle & Problem Details Section */}
                <div className="mt-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Vehicle & Problem Details</h2>
                    <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg space-y-3 text-gray-600 dark:text-gray-300">
                        <p><strong>Vehicle Model:</strong> {booking.bikeModel || 'Not provided'}</p>
                        <p><strong>Problem Description:</strong> {booking.notes || 'Not provided'}</p>
                    </div>
                </div>

                {/* Back to Dashboard Link */}
                <div className="mt-8 text-center">
                    <Link to="/admin/bookings" className="text-blue-500 hover:underline dark:text-blue-400">
                        ← Back to All Bookings
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default BookingDetails;