import React, { useState, useEffect, useRef, useContext } from 'react';
import {
    LayoutDashboard, CalendarDays, User, LogOut, Menu, X, Sun, Moon,
    PlusCircle, Bike, Wrench, Edit, Trash2, AlertTriangle, Camera, MapPin,
    CreditCard, ArrowLeft, Gift, ArrowRight, ChevronDown, ChevronUp, // Import ChevronDown for the dropdown
    MessageSquare, Send, Paperclip, FileText, XCircle, Home,
    Search, ThumbsUp, Star, MessageCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import { AuthContext } from '../auth/AuthContext';
import { submitReview } from '../api/reviewService';
import GeminiChatbot from '../components/GeminiChatbot'; // Import the Gemini AI Chatbot component

const socket = io.connect("http://localhost:5050");
const API_BASE_URL_USER = "http://localhost:5050/api/user";
// Removed API_BASE_URL_ADMIN as it was causing Forbidden errors for regular users.
// The workshop details (like P/D charge) will be hardcoded or assumed if not available via user API.

// Define a default rate for pickup/dropoff services on the frontend for calculation.
// In a real application, this should ideally be fetched from a public/user-accessible backend endpoint,
// or configured server-side and included in responses for relevant actions (e.g., fetching services).
const DEFAULT_PICKUP_DROPOFF_CHARGE_PER_KM = 50; // Example: Rs. 50 per km

const apiFetchUser = async (endpoint, options = {}) => {
    const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        ...options.headers
    };
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    const response = await fetch(`${API_BASE_URL_USER}${endpoint}`, { ...options, headers });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'An API error occurred.');
    }
    return response;
};


// --- START: Helper & Shared Components ---

const getStatusColor = (status) => {
    switch (status) {
        case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'In Progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'Pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        case 'Paid': return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300';
        case 'COD': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        case 'Khalti': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
        case 'eSewa': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
};

const Card = ({ children, className = '' }) => (<div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300 ${className}`}>{children}</div>);

const StatusBadge = ({ status }) => (<span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(status)}`}>{status}</span>);

const Button = ({ children, onClick, className = '', variant = 'primary', ...props }) => {
    const baseClasses = "px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
        success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
        special: "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500"
    };
    return (<button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>{children}</button>);
};

const Input = React.forwardRef(({ id, label, ...props }, ref) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <input id={id} {...props} ref={ref} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600" />
    </div>
));

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmButtonVariant = 'danger', Icon = AlertTriangle, iconColor = 'text-red-600 dark:text-red-400', iconBgColor = 'bg-red-100 dark:bg-red-900/50' }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <Card className="w-full max-w-md">
                <div className="text-center">
                    <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${iconBgColor}`}><Icon className={`h-6 w-6 ${iconColor}`} /></div>
                    <h3 className="mt-5 text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
                    <div className="mt-2 px-7 py-3"><p className="text-sm text-gray-500 dark:text-gray-400">{message}</p></div>
                    <div className="flex justify-center gap-3 mt-4">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button variant={confirmButtonVariant} onClick={onConfirm}>{confirmText}</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="!px-3 !py-1.5 text-sm">
                <ArrowLeft size={16} /> Previous
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300">Page {currentPage} of {totalPages}</span>
            <Button variant="secondary" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="!px-3 !py-1.5 text-sm">
                Next <ArrowRight size={16} />
            </Button>
        </div>
    );
};

const LoadMoreControl = ({ onToggle, isExpanded, hasMore }) => {
    if (!hasMore) return null;
    return (
        <div className="flex justify-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={onToggle} className="!px-6 !py-2 text-sm !gap-1.5 transform hover:scale-105 hover:shadow-lg transition-all duration-200">
                {isExpanded ? (<><ChevronUp size={18} /> Show Less</>) : (<><ChevronDown size={18} /> Load More</>)}
            </Button>
        </div>
    );
};

const StarRating = ({ rating = 0, onRatingChange, readOnly = false, size = 20 }) => {
    const [hoverRating, setHoverRating] = useState(0);
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((index) => (
                <Star
                    key={index}
                    size={size}
                    className={`transition-colors duration-200 ${!readOnly ? 'cursor-pointer' : ''} ${
                        (hoverRating || rating) >= index
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                    }`}
                    onMouseOver={() => !readOnly && setHoverRating(index)}
                    onMouseLeave={() => !readOnly && setHoverRating(0)}
                    onClick={() => !readOnly && onRatingChange && onRatingChange(index)}
                />
            ))}
        </div>
    );
};

// --- START: Page Specific Components ---

const ReviewModal = ({ isOpen, onClose, booking, onReviewSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRating(0);
            setComment('');
        }
    }, [isOpen]);

    if (!isOpen || !booking) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error("Please select a star rating.");
            return;
        }
        if (comment.trim() === '') {
            toast.error("Please leave a comment.");
            return;
        }
        setIsSubmitting(true);
        try {
            await submitReview(booking._id, { rating, comment });
            toast.success("Thank you for your review!");
            onReviewSubmitted();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Failed to submit review.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg relative animate-fade-in-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Leave a Review</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">How was your experience with the "{booking.serviceType}" service?</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col items-center">
                        <label className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Your Rating</label>
                        <StarRating rating={rating} onRatingChange={setRating} size={36} />
                    </div>
                    <div>
                        <label htmlFor="comment" className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Your Comments</label>
                        <textarea
                            id="comment"
                            rows="5"
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                            placeholder="Tell us about your experience..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        ></textarea>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Review'}
                            <ThumbsUp size={20} />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ReviewsList = ({ reviews }) => {
    if (!reviews || reviews.length === 0) {
        return (
            <div className="text-center py-12">
                <MessageCircle size={48} className="mx-auto text-gray-400" />
                <h3 className="mt-4 text-xl font-semibold">No Reviews Yet</h3>
                <p className="mt-1 text-sm text-gray-500">Be the first to leave a review for this service!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {reviews.slice().reverse().map((review) => (
                <div key={review._id} className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex-shrink-0">
                        {review.user && review.user.profilePicture ? (
                            <img
                                src={`http://localhost:5050/${review.user.profilePicture}`}
                                alt={review.username}
                                className="w-10 h-10 rounded-full object-cover bg-gray-200"
                                onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.username)}&background=random`; }}
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-lg text-blue-600 dark:text-blue-300">
                                {review.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-gray-800 dark:text-white">{review.username}</h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="my-1">
                            <StarRating rating={review.rating} readOnly={true} size={16} />
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">{review.comment}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const UserDashboardPage = () => {
    const [stats, setStats] = useState({ upcomingBookings: 0, completedServices: 0, loyaltyPoints: 0 });
    const [recentBookings, setRecentBookings] = useState([]);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await apiFetchUser('/dashboard-summary');
                const data = await response.json();
                setStats({ upcomingBookings: data.data.upcomingBookings, completedServices: data.data.completedServices, loyaltyPoints: data.data.loyaltyPoints || 0 });
                setRecentBookings(data.data.recentBookings || []);
            } catch (error) { toast.error(error.message || "Failed to fetch dashboard summary."); }
        };
        fetchData();
    }, []);
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="hover:border-blue-500 border-2 border-transparent"><div className="flex items-center gap-4"><div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full"><CalendarDays className="text-blue-600 dark:text-blue-300" size={28} /></div><div><p className="text-gray-500 dark:text-gray-400 text-sm">Upcoming Bookings</p><p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.upcomingBookings}</p></div></div></Card>
                <Card className="hover:border-green-500 border-2 border-transparent"><div className="flex items-center gap-4"><div className="p-3 bg-green-100 dark:bg-green-900 rounded-full"><Wrench className="text-green-600 dark:text-green-300" size={28} /></div><div><p className="text-gray-500 dark:text-gray-400 text-sm">Completed Services</p><p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.completedServices}</p></div></div></Card>
                <Card className="hover:border-purple-500 border-2 border-transparent"><div className="flex items-center gap-4"><div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full"><Gift className="text-purple-600 dark:text-purple-300" size={28} /></div><div><p className="text-gray-500 dark:text-gray-400 text-sm">Loyalty Points</p><p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.loyaltyPoints}</p></div></div></Card>
                <a href="#/user/new-booking" className="md:col-span-1"><Card className="h-full flex flex-col items-center justify-center text-center bg-blue-50 dark:bg-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900 border-2 border-dashed border-blue-400 hover:border-blue-600"><PlusCircle className="text-blue-600 dark:text-blue-400 mb-2" size={32} /><h3 className="text-xl font-semibold text-blue-800 dark:text-blue-300">Book a New Service</h3><p className="text-sm text-gray-500 dark:text-gray-400">Get your bike checked</p></Card></a>
            </div>
            <Card>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Recent Activity</h2>
                <div className="overflow-x-auto">
                    {recentBookings.length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="text-sm text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="p-3">Service</th><th className="p-3">Bike Model</th><th className="p-3">Date</th><th className="p-3">Status</th><th className="p-3 text-right">Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentBookings.map(booking => (
                                    <tr key={booking._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                        <td className="p-3 font-medium text-gray-900 dark:text-white">{booking.serviceType}</td>
                                        <td className="p-3 text-gray-600 dark:text-gray-300">{booking.bikeModel}</td>
                                        <td className="p-3 text-gray-600 dark:text-gray-300">{new Date(booking.date).toLocaleDateString()}</td>
                                        <td className="p-3"><StatusBadge status={booking.status} /></td>
                                        <td className="p-3 text-right font-medium text-gray-900 dark:text-white">रु{booking.finalAmount ?? booking.totalCost}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <p className="text-gray-500 dark:text-gray-400">You have no recent bookings.</p>
                            <Button className="mt-4" onClick={() => window.location.hash = '#/user/new-booking'}>Book Your First Service</Button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

const UserServiceHomePage = ({ currentUser }) => {
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const fetchServices = async () => {
            setIsLoading(true);
            try {
                const response = await apiFetchUser('/services');
                const data = await response.json();
                setServices(data.data || []);
            } catch (error) {
                toast.error(error.message || "Failed to load services.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchServices();
    }, []);
    const handleImageError = (e) => { e.target.src = '/motofix.png'; };
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <Bike className="animate-pulse text-blue-500" size={48} />
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Loading Services...</p>
            </div>
        );
    }
    return (
        <div className="space-y-16 md:space-y-24">
            <section className="relative text-center bg-gray-900 text-white py-20 px-6 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('/moto2.png')" }} />
                <div className="relative z-10 flex flex-col items-center">
                    <Bike size={64} className="mb-4 text-blue-400" />
                    <h1 className="text-4xl md:text-5xl font-extrabold">Welcome, {currentUser?.fullName || 'Rider'}!</h1>
                    <p className="mt-4 max-w-2xl text-lg md:text-xl text-gray-300">The best care for your bike is just a click away. Fast, reliable, and professional.</p>
                    <a href="#/user/home#services-section"><Button size="lg" className="mt-8 bg-blue-600 hover:bg-blue-700 group">Explore Services<ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" /></Button></a>
                </div>
            </section>
            <section className="text-center">
                <h2 className="inline-flex items-center text-3xl font-bold text-gray-800 dark:text-white"><Wrench className="mr-3 text-gray-400" size={32} />How It Works</h2>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Get your bike serviced in 3 simple steps.</p>
                <div className="grid md:grid-cols-3 gap-8 mt-10">
                    <div className="flex flex-col items-center p-4"><div className="bg-blue-100 dark:bg-blue-900/50 p-4 rounded-full"><Search size={32} className="text-blue-500 dark:text-blue-400" /></div><h3 className="text-xl font-semibold mt-4">1. Choose Service</h3><p className="text-gray-500 dark:text-gray-400 mt-1">Find the perfect service package for your needs.</p></div>
                    <div className="flex flex-col items-center p-4"><div className="bg-blue-100 dark:bg-blue-900/50 p-4 rounded-full"><CalendarDays size={32} className="text-blue-500 dark:text-blue-400" /></div><h3 className="text-xl font-semibold mt-4">2. Book Your Slot</h3><p className="text-gray-500 dark:text-gray-400 mt-1">Select a convenient date and time that works for you.</p></div>
                    <div className="flex flex-col items-center p-4"><div className="bg-blue-100 dark:bg-blue-900/50 p-4 rounded-full"><ThumbsUp size={32} className="text-blue-500 dark:text-blue-400" /></div><h3 className="text-xl font-semibold mt-4">3. We Handle the Rest</h3><p className="text-gray-500 dark:text-gray-400 mt-1">Our expert mechanics ensure your bike is in top condition.</p></div>
                </div>
            </section>
            <section id="services-section" className="space-y-8 pt-8">
                <div className="text-center"><h2 className="inline-flex items-center text-3xl md:text-4xl font-bold text-gray-800 dark:text-white"><Home className="mr-3 text-gray-400" size={36} />Our Services</h2><p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Choose a service below to get started.</p></div>
                {services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {services.map(service => (
                            <a key={service._id} href={`#/user/service-details/${service._id}`} className="group block">
                                <Card className="flex flex-col h-full text-center overflow-hidden rounded-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105 group-hover:ring-2 group-hover:ring-blue-500">
                                    <div className="relative"><img src={`http://localhost:5050/${service.image}`} alt={service.name} onError={handleImageError} className="w-full h-40 object-cover" /><div className="absolute top-2 right-2 bg-black/50 text-white text-sm px-2 py-1 rounded-full">रु{service.price}</div></div>
                                    <div className="p-4 flex flex-col flex-grow">
                                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{service.name}</h3>
                                        <div className="flex items-center justify-center gap-2 my-2"><StarRating rating={service.rating} readOnly={true} size={18} /><span className="text-xs text-gray-500 dark:text-gray-400">({service.numReviews} reviews)</span></div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex-grow">{service.description}</p>
                                        <Button className="mt-4 w-full group/button bg-black text-white hover:bg-blue-700 dark:bg-gray-200 dark:text-black dark:hover:bg-blue-500 dark:hover:text-white">View Details <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-1" /></Button>
                                    </div>
                                </Card>
                            </a>
                        ))}
                    </div>
                ) : (
                    <Card className="text-center py-16"><Wrench size={48} className="mx-auto text-gray-400" /><h3 className="mt-4 text-xl font-semibold">No Services Available</h3><p className="mt-1 text-sm text-gray-500">Please check back later for new services.</p></Card>
                )}
            </section>
        </div>
    );
};

const ServiceDetailPage = () => {
    const [service, setService] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const fetchService = async () => {
            const id = window.location.hash.split('/').pop();
            if (!id) {
                toast.error("Service ID not found.");
                window.location.hash = '#/user/home';
                return;
            }
            setIsLoading(true);
            try {
                const response = await apiFetchUser(`/services/${id}`);
                const data = await response.json();
                setService(data.data);
            } catch (error) {
                toast.error(error.message || "Could not load service details.");
                window.location.hash = '#/user/home';
            } finally {
                setIsLoading(false);
            }
        };
        fetchService();
    }, []);
    const handleBookNow = () => { if (service) { window.location.hash = `#/user/new-booking?serviceId=${service._id}`; } };
    const handleImageError = (e) => { e.target.src = '/motofix.png'; };
    if (isLoading) { return (<div className="text-center p-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div><p className="mt-2 text-gray-500">Loading Service Details...</p></div>); }
    if (!service) { return (<div className="text-center p-12"><h1 className="text-2xl font-bold">Service Not Found</h1><p className="text-gray-500 mt-2">The service you are looking for may have been removed.</p><Button onClick={() => window.location.hash = '#/user/home'} className="mt-4"><ArrowLeft size={20} /> Back to Services</Button></div>); }
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4"><button onClick={() => window.history.back()} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Go Back"><ArrowLeft size={24} /></button><h1 className="text-3xl font-bold text-gray-800 dark:text-white">{service.name}</h1></div>
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    <div><img src={`http://localhost:5050/${service.image}`} alt={service.name} onError={handleImageError} className="w-full h-auto max-h-96 object-contain rounded-lg bg-gray-100 dark:bg-gray-900 p-2" /></div>
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-white">{service.name}</h2>
                        <div className="flex items-center gap-2 mb-4"><StarRating rating={service.rating} readOnly={true} /><span className="text-sm text-gray-600 dark:text-gray-400">{service.rating.toFixed(1)} stars ({service.numReviews} reviews)</span></div>
                        <div className="prose dark:prose-invert text-gray-600 dark:text-gray-300"><p className="whitespace-pre-wrap">{service.description}</p></div>
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-baseline gap-8">
                                <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</p><p className="text-3xl font-bold text-blue-600 dark:text-blue-400">रु{service.price}</p></div>
                                {service.duration && (<div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Est. Time</p><p className="text-3xl font-bold text-gray-800 dark:text-white">{service.duration}</p></div>)}
                            </div>
                        </div>
                        <div className="mt-auto pt-8"><Button onClick={handleBookNow} className="w-full !py-3 !text-lg !font-bold"><PlusCircle size={22} /> Book This Service Now</Button></div>
                    </div>
                </div>
            </Card>
            <Card>
                <h3 className="text-2xl font-bold mb-4">Customer Reviews</h3>
                <ReviewsList reviews={service.reviews} />
            </Card>
        </div>
    );
};

const UserBookingsPage = () => {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [bookingToDelete, setBookingToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [bookingToReview, setBookingToReview] = useState(null);
    const fetchBookingsCallback = useRef();

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
    
    fetchBookingsCallback.current = () => fetchBookings(currentPage);

    useEffect(() => {
        fetchBookings(currentPage);
    }, [currentPage]);

    useEffect(() => {
        const handleRefresh = () => {
            if (fetchBookingsCallback.current) {
                fetchBookingsCallback.current();
            }
        };
        window.addEventListener('refreshBookings', handleRefresh);
        return () => {
            window.removeEventListener('refreshBookings', handleRefresh);
        };
    }, []);

    const handleDelete = async () => {
        if (!bookingToDelete) return;
        try {
            await apiFetchUser(`/bookings/${bookingToDelete}`, { method: 'DELETE' });
            toast.success('Booking cancelled successfully.');
            setBookingToDelete(null);
            fetchBookings(currentPage);
        } catch (error) { toast.error(error.message || "Failed to cancel booking."); }
    };

    const handleOpenReviewModal = (booking) => {
        setBookingToReview(booking);
        setReviewModalOpen(true);
    };

    return (
        <div className="space-y-6 flex flex-col flex-grow">
            <div className="flex justify-between items-center"><h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Bookings</h1><Button onClick={() => window.location.hash = '#/user/new-booking'}><PlusCircle size={20} />New Booking</Button></div>
            <Card className="flex flex-col flex-grow">
                <div className="overflow-x-auto flex-grow">{isLoading ? (<div className="text-center p-12 text-gray-500 dark:text-gray-400">Loading bookings...</div>) : bookings.length > 0 ? (<table className="w-full text-left"><thead className="text-sm text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700"><tr><th className="p-3">Service</th><th className="p-3">Bike</th><th className="p-3">Date</th><th className="p-3">Status</th><th className="p-3">P/D</th> {/* New column for Pickup/Dropoff */} <th className="p-3">Payment</th><th className="p-3 text-right">Cost</th><th className="p-3 text-center">Actions</th></tr></thead><tbody>{bookings.map(booking => (<tr key={booking._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50"><td className="p-3 font-medium text-gray-900 dark:text-white">{booking.serviceType}</td><td className="p-3 text-gray-600 dark:text-gray-300">{booking.bikeModel}</td><td className="p-3 text-gray-600 dark:text-gray-300">{new Date(booking.date).toLocaleDateString()}</td><td className="p-3"><StatusBadge status={booking.status} /></td>
                    <td className="p-3 text-center"> {/* Pickup/Dropoff status */}
                        {booking.requestedPickupDropoff ? (
                            <span className="text-green-600 dark:text-green-400 font-semibold">Yes</span>
                        ) : (
                            <span className="text-gray-500 dark:text-gray-400">No</span>
                        )}
                    </td>
                    <td className="p-3"><StatusBadge status={booking.paymentStatus} /></td><td className="p-3 text-right font-semibold">{booking.discountApplied && (<span className="text-xs text-red-500 line-through mr-1">रु{booking.totalCost}</span>)}रु{booking.finalAmount ?? booking.totalCost}</td>
                    <td className="p-3 text-center">
                        <div className="flex justify-center gap-2">
                            {booking.reviewSubmitted ? (<Button variant="secondary" size="sm" disabled title="Review Submitted" className="!px-2 !py-1"><ThumbsUp size={16} /></Button>) : (<Button variant={booking.status === 'Completed' ? "success" : "secondary"} size="sm" onClick={() => handleOpenReviewModal(booking)} disabled={booking.status !== 'Completed'} title={booking.status === 'Completed' ? "Leave a Review" : "You can leave a review once the service is completed"} className="!px-2 !py-1"><Star size={16} /></Button>)}
                            <Button variant="secondary" size="sm" onClick={() => window.location.hash = `#/user/edit-booking/${booking._id}`} disabled={booking.status !== 'Pending' || booking.isPaid || booking.discountApplied} title="Edit Booking" className="!px-2 !py-1"><Edit size={16} /></Button>
                            <Button variant="danger" size="sm" onClick={() => setBookingToDelete(booking._id)} disabled={booking.isPaid} title="Cancel Booking" className="!px-2 !py-1"><Trash2 size={16} /></Button>
                        </div>
                    </td></tr>))}</tbody></table>) : (<div className="text-center py-12"><Bike size={48} className="mx-auto text-gray-400" /><h3 className="mt-2 text-xl font-semibold">No Bookings Yet</h3><p className="mt-1 text-sm text-gray-500">Looks like you haven't booked any services with us.</p></div>)}</div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </Card>
            <ConfirmationModal isOpen={!!bookingToDelete} onClose={() => setBookingToDelete(null)} onConfirm={handleDelete} title="Cancel Booking" message="Are you sure you want to cancel this booking?" confirmText="Yes, Cancel" />
            <ReviewModal isOpen={reviewModalOpen} onClose={() => setReviewModalOpen(false)} booking={bookingToReview} onReviewSubmitted={() => fetchBookings(currentPage)} />
        </div>
    );
};

const EditBookingPage = () => {
    const [formData, setFormData] = useState({ 
        serviceId: '', 
        bikeModel: '', 
        date: '', 
        notes: '',
        requestedPickupDropoff: false,
        pickupAddress: '',
        dropoffAddress: '',
        pickupCoordinates: null,
        dropoffCoordinates: null,
        pickupDropoffDistance: 0,
        pickupDropoffCost: 0
    });
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingPickupLocation, setIsFetchingPickupLocation] = useState(false);
    const [isFetchingDropoffLocation, setIsFetchingDropoffLocation] = useState(false);


    // Helper to calculate distance (dummy for now)
    const calculateDistance = (coord1, coord2) => {
        if (!coord1 || !coord2) return 0;
        // In a real application, integrate with a mapping service API
        // For demonstration, returning a fixed dummy distance or random for variability
        const lat1 = coord1.lat;
        const lon1 = coord1.lng;
        const lat2 = coord2.lat;
        const lon2 = coord2.lng;

        const R = 6371; // Radius of Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km
        return parseFloat(distance.toFixed(2));
    };

    const updateCosts = (currentFormData, currentServices) => { // Removed currentWorkshopDetails
        const selectedService = currentServices.find(s => s._id === currentFormData.serviceId);
        let baseCost = selectedService ? selectedService.price : 0;
        let pDcost = 0;
        let pDDistance = 0;

        // Use hardcoded rate, as admin profile is not accessible to user
        if (currentFormData.requestedPickupDropoff) {
            if (currentFormData.pickupCoordinates && currentFormData.dropoffCoordinates) {
                pDDistance = calculateDistance(currentFormData.pickupCoordinates, currentFormData.dropoffCoordinates);
                pDcost = pDDistance * DEFAULT_PICKUP_DROPOFF_CHARGE_PER_KM;
            }
        }
        return {
            totalCost: baseCost,
            finalAmount: baseCost + pDcost,
            pickupDropoffCost: pDcost,
            pickupDropoffDistance: pDDistance
        };
    };


    useEffect(() => {
        const id = window.location.hash.split('/').pop();
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const servicesRes = await apiFetchUser('/services');
                const { data: allServices } = await servicesRes.json();
                setServices(allServices || []);

                // Removed fetching workshop details for regular user due to 403 Forbidden.

                const bookingRes = await apiFetchUser(`/bookings/${id}`);
                const { data: booking } = await bookingRes.json();

                if (booking) {
                    if (booking.isPaid || booking.discountApplied || booking.status !== 'Pending') { 
                        toast.error("This booking can no longer be edited."); 
                        window.location.hash = '#/user/bookings'; 
                        return; 
                    }
                    const service = (allServices || []).find(s => s.name === booking.serviceType);
                    const initialFormData = {
                        serviceId: service ? service._id : '',
                        bikeModel: booking.bikeModel,
                        date: new Date(booking.date).toISOString().split('T')[0],
                        notes: booking.notes,
                        requestedPickupDropoff: booking.requestedPickupDropoff || false,
                        pickupAddress: booking.pickupAddress || '',
                        dropoffAddress: booking.dropoffAddress || '',
                        pickupCoordinates: booking.pickupCoordinates || null,
                        dropoffCoordinates: booking.dropoffCoordinates || null,
                        // These will be recalculated on save
                        pickupDropoffDistance: booking.pickupDropoffDistance || 0,
                        pickupDropoffCost: booking.pickupDropoffCost || 0,
                        totalCost: booking.totalCost, // Base service cost
                        finalAmount: booking.finalAmount // Calculated final amount
                    };
                    setFormData(initialFormData);
                } else { throw new Error("Booking not found."); }
            } catch (err) { toast.error(err.message || "Failed to load booking data."); window.location.hash = '#/user/bookings'; }
            finally { setIsLoading(false); }
        };
        if (id) { fetchInitialData(); }
    }, []);

    const handleChange = (e) => { 
        const { name, value, type, checked } = e.target;
        let newFormData = { ...formData, [name]: type === 'checkbox' ? checked : value };

        // If serviceId changes, update base cost
        if (name === 'serviceId') {
            const selectedService = services.find(s => s._id === value);
            if (selectedService) {
                newFormData.totalCost = selectedService.price;
            }
        }
        
        // Recalculate costs if pickup/dropoff status changes or serviceId changes
        const { totalCost, finalAmount, pickupDropoffCost, pickupDropoffDistance } = updateCosts(newFormData, services); // Removed workshopDetails
        setFormData(prev => ({ 
            ...newFormData,
            totalCost: totalCost,
            finalAmount: finalAmount,
            pickupDropoffCost: pickupDropoffCost,
            pickupDropoffDistance: pickupDropoffDistance
        }));
    };

    const handleFetchLocation = (type) => {
        if (!navigator.geolocation) { toast.error("Geolocation is not supported by your browser."); return; }

        if (type === 'pickup') setIsFetchingPickupLocation(true);
        else setIsFetchingDropoffLocation(true);

        toast.info(`Fetching your ${type} location...`);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const coords = { lat: latitude, lng: longitude };
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    let newAddress = data.display_name || '';

                    let updatedFormData;
                    if (type === 'pickup') {
                        updatedFormData = { ...formData, pickupAddress: newAddress, pickupCoordinates: coords };
                    } else {
                        updatedFormData = { ...formData, dropoffAddress: newAddress, dropoffCoordinates: coords };
                    }

                    const { totalCost, finalAmount, pickupDropoffCost, pickupDropoffDistance } = updateCosts(updatedFormData, services); // Removed workshopDetails
                    setFormData(prev => ({ 
                        ...updatedFormData,
                        totalCost: totalCost,
                        finalAmount: finalAmount,
                        pickupDropoffCost: pickupDropoffCost,
                        pickupDropoffDistance: pickupDropoffDistance
                    }));
                    toast.success(`${type} location fetched and address updated!`);
                } catch (error) { 
                    toast.error(`Failed to fetch ${type} address. Please enter manually.`); 
                } finally { 
                    if (type === 'pickup') setIsFetchingPickupLocation(false);
                    else setIsFetchingDropoffLocation(false);
                }
            },
            (error) => {
                let errorMessage = `An unknown geolocation error occurred for ${type} location.`;
                if (error.code === error.PERMISSION_DENIED) { errorMessage = `Location access denied for ${type}. Please enable it.`; }
                else if (error.code === error.POSITION_UNAVAILABLE) { errorMessage = `${type} location information is currently unavailable.`; }
                else if (error.code === error.TIMEOUT) { errorMessage = `Request for ${type} location timed out.`; }
                toast.error(errorMessage);
                if (type === 'pickup') setIsFetchingPickupLocation(false);
                else setIsFetchingDropoffLocation(false);
            }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Final cost calculation before submission
        const { totalCost, finalAmount, pickupDropoffCost, pickupDropoffDistance } = updateCosts(formData, services); // Removed workshopDetails
        const dataToSend = {
            ...formData,
            totalCost,
            finalAmount,
            pickupDropoffCost,
            pickupDropoffDistance
        };

        try {
            const bookingId = window.location.hash.split('/').pop();
            const response = await apiFetchUser(`/bookings/${bookingId}`, { method: 'PUT', body: JSON.stringify(dataToSend) });
            const data = await response.json();
            toast.success(data.message || "Booking updated successfully!");
            window.location.hash = '#/user/bookings';
        } catch (err) { toast.error(err.message || "Failed to update booking."); }
        finally { setIsSubmitting(false); }
    };

    if (isLoading) return <div className="text-center p-12">Loading...</div>;
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4"><button onClick={() => window.history.back()} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ArrowLeft size={24} /></button><h1 className="text-3xl font-bold text-gray-800 dark:text-white">Edit Booking</h1></div>
            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Service*</label>
                        <select id="serviceId" name="serviceId" value={formData.serviceId} onChange={handleChange} required className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:text-white">
                            <option value="" disabled>-- Choose a service --</option>
                            {services.map(service => (<option key={service._id} value={service._id}>{service.name} (Approx. रु{service.price})</option>))}
                        </select>
                    </div>
                    <Input id="bikeModel" name="bikeModel" label="Bike Model" value={formData.bikeModel} onChange={handleChange} required />
                    <Input id="date" name="date" label="Preferred Date" type="date" value={formData.date} onChange={handleChange} required min={new Date().toISOString().split("T")[0]} />
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Problem Description</label>
                        <textarea id="notes" name="notes" rows="4" value={formData.notes || ''} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:text-white" placeholder="Any specific issues or requests?"></textarea>
                    </div>

                    {/* ALWAYS show the option for P/D service */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Pick-up & Drop-off Service</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="requestedPickupDropoff"
                                        checked={formData.requestedPickupDropoff}
                                        onChange={handleChange}
                                        className="form-checkbox h-5 w-5 text-blue-600 rounded-md focus:ring-blue-500"
                                    />
                                    <span>Request Pick-up and Drop-off (रु{DEFAULT_PICKUP_DROPOFF_CHARGE_PER_KM} per km)</span>
                                </label>
                            </div>

                            {formData.requestedPickupDropoff && (
                                <>
                                    <div>
                                        <label htmlFor="pickupAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pickup Address*</label>
                                        <div className="flex items-center gap-2">
                                            <textarea 
                                                id="pickupAddress" 
                                                name="pickupAddress" 
                                                rows="2" 
                                                value={formData.pickupAddress} 
                                                onChange={handleChange} 
                                                required={formData.requestedPickupDropoff}
                                                className="flex-grow px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:text-white" 
                                                placeholder="Enter pickup address"
                                            />
                                            <Button type="button" variant="secondary" onClick={() => handleFetchLocation('pickup')} disabled={isFetchingPickupLocation}>
                                                <MapPin size={18} className={isFetchingPickupLocation ? 'animate-pulse' : ''} />
                                            </Button>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="dropoffAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dropoff Address*</label>
                                        <div className="flex items-center gap-2">
                                            <textarea 
                                                id="dropoffAddress" 
                                                name="dropoffAddress" 
                                                rows="2" 
                                                value={formData.dropoffAddress} 
                                                onChange={handleChange} 
                                                required={formData.requestedPickupDropoff}
                                                className="flex-grow px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:text-white" 
                                                placeholder="Enter dropoff address"
                                            />
                                            <Button type="button" variant="secondary" onClick={() => handleFetchLocation('dropoff')} disabled={isFetchingDropoffLocation}>
                                                <MapPin size={18} className={isFetchingDropoffLocation ? 'animate-pulse' : ''} />
                                            </Button>
                                        </div>
                                    </div>
                                    {formData.pickupDropoffCost > 0 && (
                                        <div className="text-right text-sm text-gray-600 dark:text-gray-300">
                                            <span>Calculated Pick-up/Drop-off Cost: </span>
                                            <span className="font-semibold">रु{formData.pickupDropoffCost.toFixed(2)}</span>
                                            {formData.pickupDropoffDistance > 0 && <span> ({formData.pickupDropoffDistance.toFixed(2)} km)</span>}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    
                    <div className="text-right text-xl font-bold text-gray-800 dark:text-white">
                        Current Total: रु{formData.finalAmount.toFixed(2)}
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" type="button" onClick={() => window.location.hash = '#/user/bookings'}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

const NewBookingPage = () => {
    const [services, setServices] = useState([]);
    // Removed workshopDetails state, as it's no longer fetched directly by the user dashboard
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
    const [formData, setFormData] = useState({ 
        serviceId: '', 
        bikeModel: '', 
        date: '', 
        notes: '',
        requestedPickupDropoff: false,
        pickupAddress: '',
        dropoffAddress: '',
        pickupCoordinates: null,
        dropoffCoordinates: null,
        pickupDropoffDistance: 0,
        pickupDropoffCost: 0
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingPickupLocation, setIsFetchingPickupLocation] = useState(false);
    const [isFetchingDropoffLocation, setIsFetchingDropoffLocation] = useState(false);


    // Helper to calculate distance (dummy for now)
    const calculateDistance = (coord1, coord2) => {
        if (!coord1 || !coord2) return 0;
        // In a real application, integrate with a mapping service API
        // For demonstration, returning a fixed dummy distance or random for variability
        const lat1 = coord1.lat;
        const lon1 = coord1.lng;
        const lat2 = coord2.lat;
        const lon2 = coord2.lng;

        const R = 6371; // Radius of Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km
        return parseFloat(distance.toFixed(2));
    };

    // Removed currentWorkshopDetails from parameters as it's not available here
    const updateCosts = (currentFormData, currentServices) => {
        const selectedService = currentServices.find(s => s._id === currentFormData.serviceId);
        let baseCost = selectedService ? selectedService.price : 0;
        let pDcost = 0;
        let pDDistance = 0;

        // Use hardcoded rate, as admin profile is not accessible to user
        if (currentFormData.requestedPickupDropoff) {
            if (currentFormData.pickupCoordinates && currentFormData.dropoffCoordinates) {
                pDDistance = calculateDistance(currentFormData.pickupCoordinates, currentFormData.dropoffCoordinates);
                pDcost = pDDistance * DEFAULT_PICKUP_DROPOFF_CHARGE_PER_KM;
            }
        }
        return {
            totalCost: baseCost,
            finalAmount: baseCost + pDcost,
            pickupDropoffCost: pDcost,
            pickupDropoffDistance: pDDistance
        };
    };

    useEffect(() => {
        const hash = window.location.hash;
        const urlParams = new URLSearchParams(hash.substring(hash.indexOf('?')));
        const preselectedServiceId = urlParams.get('serviceId');

        const fetchInitialData = async () => {
            setIsLoadingInitialData(true);
            try {
                const servicesRes = await apiFetchUser('/services');
                const { data: allServices } = await servicesRes.json();
                setServices(allServices || []);

                // Removed fetching workshop details for regular user due to 403 Forbidden.
                
                setFormData(prev => {
                    const initialServiceId = preselectedServiceId || prev.serviceId;
                    const initialData = { ...prev, serviceId: initialServiceId };
                    // Pass null for workshopProfile as it's not directly fetched by the user
                    const { totalCost, finalAmount, pickupDropoffCost, pickupDropoffDistance } = updateCosts(initialData, allServices);
                    return {
                        ...initialData,
                        totalCost: totalCost,
                        finalAmount: finalAmount,
                        pickupDropoffCost: pickupDropoffCost,
                        pickupDropoffDistance: pickupDropoffDistance
                    };
                });
            } catch (err) { toast.error(err.message || "Could not load initial data. Please try again later."); }
            finally { setIsLoadingInitialData(false); }
        };
        fetchInitialData();
    }, []);

    const handleChange = (e) => { 
        const { name, value, type, checked } = e.target;
        let newFormData = { ...formData, [name]: type === 'checkbox' ? checked : value };

        // If serviceId changes, update base cost
        if (name === 'serviceId') {
            const selectedService = services.find(s => s._id === value);
            if (selectedService) {
                newFormData.totalCost = selectedService.price;
            }
        }
        
        // Recalculate costs if pickup/dropoff status changes or serviceId changes
        const { totalCost, finalAmount, pickupDropoffCost, pickupDropoffDistance } = updateCosts(newFormData, services); // Removed workshopDetails
        setFormData(prev => ({ 
            ...newFormData,
            totalCost: totalCost,
            finalAmount: finalAmount,
            pickupDropoffCost: pickupDropoffCost,
            pickupDropoffDistance: pickupDropoffDistance
        }));
    };

    const handleFetchLocation = (type) => {
        if (!navigator.geolocation) { toast.error("Geolocation is not supported by your browser."); return; }

        if (type === 'pickup') setIsFetchingPickupLocation(true);
        else setIsFetchingDropoffLocation(true);

        toast.info(`Fetching your ${type} location...`);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const coords = { lat: latitude, lng: longitude };
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    let newAddress = data.display_name || '';

                    let updatedFormData;
                    if (type === 'pickup') {
                        updatedFormData = { ...formData, pickupAddress: newAddress, pickupCoordinates: coords };
                    } else {
                        updatedFormData = { ...formData, dropoffAddress: newAddress, dropoffCoordinates: coords };
                    }

                    const { totalCost, finalAmount, pickupDropoffCost, pickupDropoffDistance } = updateCosts(updatedFormData, services); // Removed workshopDetails
                    setFormData(prev => ({ 
                        ...updatedFormData,
                        totalCost: totalCost,
                        finalAmount: finalAmount,
                        pickupDropoffCost: pickupDropoffCost,
                        pickupDropoffDistance: pickupDropoffDistance
                    }));
                    toast.success(`${type} location fetched and address updated!`);
                } catch (error) { 
                    toast.error(`Failed to fetch ${type} address. Please enter manually.`); 
                } finally { 
                    if (type === 'pickup') setIsFetchingPickupLocation(false);
                    else setIsFetchingDropoffLocation(false);
                }
            },
            (error) => {
                let errorMessage = `An unknown geolocation error occurred for ${type} location.`;
                if (error.code === error.PERMISSION_DENIED) { errorMessage = `Location access denied for ${type}. Please enable it.`; }
                else if (error.code === error.POSITION_UNAVAILABLE) { errorMessage = `${type} location information is currently unavailable.`; }
                else if (error.code === error.TIMEOUT) { errorMessage = `Request for ${type} location timed out.`; }
                toast.error(errorMessage);
                if (type === 'pickup') setIsFetchingPickupLocation(false);
                else setIsFetchingDropoffLocation(false);
            }
        );
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.serviceId || !formData.bikeModel || !formData.date) { toast.error("Please fill out all required fields."); return; }
        
        if (formData.requestedPickupDropoff && (!formData.pickupAddress || !formData.dropoffAddress || !formData.pickupCoordinates || !formData.dropoffCoordinates)) {
            toast.error("Please provide complete pick-up and drop-off details or uncheck the option.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Recalculate costs one last time before sending to ensure accuracy
            const { totalCost, finalAmount, pickupDropoffCost, pickupDropoffDistance } = updateCosts(formData, services); // Removed workshopDetails
            const dataToSend = {
                ...formData,
                totalCost,
                finalAmount,
                pickupDropoffCost,
                pickupDropoffDistance
            };

            await apiFetchUser('/bookings', { method: 'POST', body: JSON.stringify(dataToSend) });
            toast.success("Booking submitted! Please proceed with payment.");
            window.location.hash = `#/user/my-payments`;
        } catch (err) { toast.error(err.message || "Failed to submit booking. Please try again."); }
        finally { setIsSubmitting(false); }
    };

    if (isLoadingInitialData) {
        return <div className="text-center p-12">Loading services and workshop details...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Request a New Service</h1>
            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Service*</label>
                        <select id="serviceId" name="serviceId" value={formData.serviceId} onChange={handleChange} required className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:text-white">
                            <option value="" disabled>-- Choose a service --</option>
                            {services.map(service => (<option key={service._id} value={service._id}>{service.name} (Approx. रु{service.price})</option>))}
                        </select>
                    </div>
                    <Input id="bikeModel" name="bikeModel" label="Bike Model (e.g., Bajaj Pulsar 220F)*" value={formData.bikeModel} onChange={handleChange} required />
                    <Input id="date" name="date" label="Preferred Date*" type="date" value={formData.date} onChange={handleChange} required min={new Date().toISOString().split("T")[0]} />
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explain Your Problem Here*</label>
                        <textarea id="notes" name="notes" rows="4" value={formData.notes || ""} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:text-white" placeholder="Any specific issues or requests?"></textarea>
                    </div>

                    {/* ALWAYS show the option for P/D service */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Pick-up & Drop-off Service</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="requestedPickupDropoff"
                                        checked={formData.requestedPickupDropoff}
                                        onChange={handleChange}
                                        className="form-checkbox h-5 w-5 text-blue-600 rounded-md focus:ring-blue-500"
                                    />
                                    <span>Request Pick-up and Drop-off (रु{DEFAULT_PICKUP_DROPOFF_CHARGE_PER_KM} per km)</span>
                                </label>
                            </div>

                            {formData.requestedPickupDropoff && (
                                <>
                                    <div>
                                        <label htmlFor="pickupAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pickup Address*</label>
                                        <div className="flex items-center gap-2">
                                            <textarea 
                                                id="pickupAddress" 
                                                name="pickupAddress" 
                                                rows="2" 
                                                value={formData.pickupAddress} 
                                                onChange={handleChange} 
                                                required={formData.requestedPickupDropoff}
                                                className="flex-grow px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:text-white" 
                                                placeholder="Enter pickup address"
                                            />
                                            <Button type="button" variant="secondary" onClick={() => handleFetchLocation('pickup')} disabled={isFetchingPickupLocation}>
                                                <MapPin size={18} className={isFetchingPickupLocation ? 'animate-pulse' : ''} />
                                            </Button>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="dropoffAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dropoff Address*</label>
                                        <div className="flex items-center gap-2">
                                            <textarea 
                                                id="dropoffAddress" 
                                                name="dropoffAddress" 
                                                rows="2" 
                                                value={formData.dropoffAddress} 
                                                onChange={handleChange} 
                                                required={formData.requestedPickupDropoff}
                                                className="flex-grow px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:text-white" 
                                                placeholder="Enter dropoff address"
                                            />
                                            <Button type="button" variant="secondary" onClick={() => handleFetchLocation('dropoff')} disabled={isFetchingDropoffLocation}>
                                                <MapPin size={18} className={isFetchingDropoffLocation ? 'animate-pulse' : ''} />
                                            </Button>
                                        </div>
                                    </div>
                                    {formData.pickupDropoffCost > 0 && (
                                        <div className="text-right text-sm text-gray-600 dark:text-gray-300">
                                            <span>Calculated Pick-up/Drop-off Cost: </span>
                                            <span className="font-semibold">रु{formData.pickupDropoffCost.toFixed(2)}</span>
                                            {formData.pickupDropoffDistance > 0 && <span> ({formData.pickupDropoffDistance.toFixed(2)} km)</span>}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    
                    <div className="text-right text-xl font-bold text-gray-800 dark:text-white">
                        Total Amount: रु{formData.finalAmount.toFixed(2)}
                    </div>

                    <div className="flex justify-center">
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Request'}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

const MyPaymentsPage = ({ currentUser, loyaltyPoints, onDiscountApplied }) => {
    const [unpaidBookings, setUnpaidBookings] = useState([]);
    const [paidBookings, setPaidBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAllHistory, setShowAllHistory] = useState(false);
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const pendingRes = await apiFetchUser('/bookings/pending');
            const pendingData = await pendingRes.json();
            setUnpaidBookings(pendingData.data || []);
            const historyRes = await apiFetchUser('/bookings/history');
            const historyData = await historyRes.json();
            setPaidBookings(historyData.data || []);
        } catch (error) { toast.error(error.message || 'Could not fetch your payment information.'); }
        finally { setIsLoading(false); }
    };
    useEffect(() => {
        fetchData();
        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');
        const message = params.get('message');
        if (status && message) {
            if (status === 'success') { toast.success(message); }
            else { toast.error(message); }
            window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        }
    }, []);
    const handlePaymentAndDiscount = async () => {
        await fetchData();
        const profileResponse = await apiFetchUser('/profile');
        const data = await profileResponse.json();
        onDiscountApplied(data.data.loyaltyPoints);
    };
    const handleApplyDiscount = async (bookingId) => {
        try {
            await apiFetchUser(`/bookings/${bookingId}/apply-discount`, { method: 'PUT' });
            toast.success('Discount applied!');
            handlePaymentAndDiscount();
        } catch (error) { toast.error(error.message || "Failed to apply discount."); }
    };
    const handlePayment = async (booking, method) => {
        const amountToPay = booking.finalAmount ?? booking.totalCost;
        if (method === 'COD') {
            try {
                await apiFetchUser(`/bookings/${booking._id}/pay`, { method: 'PUT', body: JSON.stringify({ paymentMethod: 'COD' }) });
                toast.success("Payment Confirmed! Your booking is now being processed.");
                handlePaymentAndDiscount();
            } catch (error) { toast.error(error.message || "Payment confirmation failed."); }
            return;
        }
        if (method === 'eSewa') {
            try {
                const response = await fetch('http://localhost:5050/api/payment/esewa/initiate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ bookingId: booking._id }) });
                if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'An API error occurred.'); }
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
            } catch (error) { toast.error(error.message || 'Error initiating eSewa payment.'); }
            return;
        }
        if (method === 'Khalti') {
            const khaltiConfig = {
                publicKey: "test_public_key_617c4c6fe77c441d88451ec1408a0c0e",
                productIdentity: booking._id, productName: booking.serviceType, productUrl: window.location.href,
                eventHandler: {
                    async onSuccess(payload) {
                        try {
                            await apiFetchUser('/bookings/verify-khalti', { method: 'POST', body: JSON.stringify({ token: payload.token, amount: payload.amount, booking_id: booking._id }) });
                            toast.success('Payment Successful & Verified!');
                            handlePaymentAndDiscount();
                        } catch (error) { toast.error(error.message || 'Payment verification failed.'); }
                    },
                    onError: (error) => toast.error('Payment process was interrupted.'),
                    onClose: () => console.log('Khalti widget closed'),
                },
                paymentPreference: ["KHALTI", "EBANKING", "MOBILE_BANKING", "CONNECT_IPS", "SCT"],
            };
            const checkout = new KhaltiCheckout(khaltiConfig);
            checkout.show({ amount: amountToPay * 100 });
        }
    };
    const displayedHistory = showAllHistory ? paidBookings : paidBookings.slice(0, 10);
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Payments</h1>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Pending Payments</h2>
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400"><Gift size={20} /><span className="font-semibold">{loyaltyPoints} Points</span></div>
                </div>
                {isLoading && unpaidBookings.length === 0 ? (<div className="text-center p-12">Loading...</div>)
                    : unpaidBookings.length > 0 ? (<div className="space-y-4">{unpaidBookings.map(booking => (<div key={booking._id} className="p-4 border rounded-lg dark:border-gray-700 flex flex-wrap justify-between items-center gap-4"><div><p className="font-bold">{booking.serviceType} for {booking.bikeModel}</p><p className="text-sm text-gray-500 dark:text-gray-400">Date: {new Date(booking.date).toLocaleDateString()}</p>
                    {/* Display P/D cost if applicable */}
                    {booking.requestedPickupDropoff && booking.pickupDropoffCost > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">P/D Service: रु{booking.pickupDropoffCost.toFixed(2)} ({booking.pickupDropoffDistance.toFixed(2)} km)</p>
                    )}
                    <div className="text-lg font-semibold mt-1">{booking.discountApplied ? (<><span className="text-base text-gray-500 line-through mr-2">रु{booking.totalCost}</span><span className="text-green-600">रु{booking.finalAmount}</span></>) : (<span>Total: रु{booking.finalAmount ?? booking.totalCost}</span>)}</div>{booking.discountApplied && <p className="text-sm font-bold text-green-500">Discount: -रु{booking.discountAmount}</p>}</div><div className="flex flex-wrap items-center gap-2">{loyaltyPoints >= 100 && !booking.discountApplied && (<Button variant="special" onClick={() => handleApplyDiscount(booking._id)}><Gift size={16} /> Apply 20% Discount</Button>)}<Button onClick={() => handlePayment(booking, 'COD')}>Pay with COD</Button><Button variant="secondary" onClick={() => handlePayment(booking, 'Khalti')} className="bg-white"><img src="/khaltilogo.png" alt="Khalti" style={{ height: '24px' }} /></Button><Button variant="secondary" onClick={() => handlePayment(booking, 'eSewa')} className="bg-white hover:bg-gray-100"><img src="/esewa_logo.png" alt="eSewa" style={{ height: '24px' }} /></Button></div></div>))}</div>)
                        : (<div className="text-center py-12"><CreditCard size={48} className="mx-auto text-gray-400" /><h3 className="mt-2 text-xl font-semibold">No Pending Payments</h3><p className="mt-1 text-sm text-gray-500">All your payments are up to date!</p></div>)}
            </Card>
            <Card className="flex flex-col flex-grow">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Payment History</h2>
                <div className="overflow-x-auto flex-grow">
                    {isLoading && paidBookings.length === 0 ? (<div className="text-center p-12">Loading history...</div>)
                        : displayedHistory.length > 0 ? (<table className="w-full text-left"><thead className="text-sm text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700"><tr><th className="p-3">Service</th><th className="p-3">Bike</th><th className="p-3">Date</th><th className="p-3">Amount Paid</th><th className="p-3">Method</th></tr></thead><tbody>{displayedHistory.map(booking => (<tr key={booking._id} className="border-b dark:border-gray-700"><td className="p-3 font-medium text-gray-900 dark:text-white">{booking.serviceType}</td><td className="p-3 text-gray-600 dark:text-gray-300">{booking.bikeModel}</td><td className="p-3 text-gray-600 dark:text-gray-300">{new Date(booking.date).toLocaleDateString()}</td><td className="p-3 font-semibold">{booking.discountApplied && (<span className="text-xs text-red-500 line-through mr-1">रु{booking.totalCost}</span>)}रु{booking.finalAmount ?? booking.totalCost}</td><td className="p-3"><StatusBadge status={booking.paymentMethod} /></td></tr>))}</tbody></table>)
                            : (<div className="text-center py-12"><p className="text-gray-500 dark:text-gray-400">No payment history found.</p></div>)}
                </div>
                <LoadMoreControl onToggle={() => setShowAllHistory(!showAllHistory)} isExpanded={showAllHistory} hasMore={paidBookings.length > 10} />
            </Card>
        </div>
    );
};

const UserProfilePage = ({ currentUser, setCurrentUser }) => {
    const [profile, setProfile] = useState({ fullName: '', email: '', phone: '', address: '', profilePicture: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [initialProfile, setInitialProfile] = useState({});
    const fileInputRef = useRef(null);
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await apiFetchUser('/profile');
                const data = await response.json();
                const profileData = { ...data.data, address: data.data.address || '' };
                setProfile(profileData);
                setInitialProfile(profileData);
            } catch (error) { toast.error(error.message || "Failed to fetch profile."); }
        };
        fetchProfile();
    }, []);
    const handleFetchLocation = async () => {
        if (!navigator.geolocation) { toast.error("Geolocation is not supported by your browser."); return; }
        setIsFetchingLocation(true);
        toast.info("Fetching your location...");
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    if (!response.ok) throw new Error('Failed to convert location to address.');
                    const data = await response.json();
                    if (data && data.display_name) {
                        setProfile(p => ({ ...p, address: data.display_name }));
                        toast.success("Location fetched successfully!");
                    } else { throw new Error('Could not find address.'); }
                } catch (error) { toast.error(error.message); } finally { setIsFetchingLocation(false); }
            },
            (error) => {
                toast.error("Geolocation permission denied. Please enable it in browser settings.");
                setIsFetchingLocation(false);
            }
        );
    };
    const handleSave = async () => {
        const formData = new FormData();
        formData.append('fullName', profile.fullName);
        formData.append('email', profile.email);
        formData.append('phone', profile.phone);
        formData.append('address', profile.address);
        if (profile.newProfilePicture) { formData.append('profilePicture', profile.newProfilePicture); }
        try {
            const response = await apiFetchUser('/profile', { method: 'PUT', body: formData });
            const data = await response.json();
            const updatedData = { ...data.data, address: data.data.address || '' };
            setProfile(updatedData);
            setInitialProfile(updatedData);
            setCurrentUser(updatedData);
            setIsEditing(false);
            toast.success(data.message || 'Profile updated successfully!');
        } catch (error) { toast.error(error.message || 'Failed to update profile.'); }
    };
    const handleCancel = () => { setProfile(initialProfile); setIsEditing(false); };
    const handleFileChange = (e) => { const file = e.target.files[0]; if (file) { setProfile(p => ({ ...p, profilePictureUrl: URL.createObjectURL(file), newProfilePicture: file })); } };
    const handleImageError = (e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName || 'U')}&background=e2e8f0&color=4a5568&size=128`; };
    const profilePictureSrc = profile.profilePictureUrl || (profile.profilePicture ? `http://localhost:5050/${profile.profilePicture}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName || 'U')}&background=e2e8f0&color=4a5568&size=128`);
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Profile</h1>
            <Card>
                <div className="flex justify-end mb-4">{!isEditing && <Button onClick={() => setIsEditing(true)}><Edit size={16} /> Edit Profile</Button>}</div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 flex flex-col items-center text-center">
                        <img key={profilePictureSrc} src={profilePictureSrc} alt="Profile" className="w-32 h-32 rounded-full object-cover mb-4 ring-4 ring-blue-500/50" onError={handleImageError} />
                        {isEditing && (<><input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" /><Button variant="secondary" onClick={() => fileInputRef.current.click()}><Camera size={16} /> Change Picture</Button></>)}
                        <h2 className="text-2xl font-semibold mt-4 text-gray-800 dark:text-white">{profile.fullName}</h2>
                        <p className="text-gray-500 dark:text-gray-400">{profile.email}</p>
                    </div>
                    <div className="lg:col-span-2 space-y-4">
                        <Input id="fullName" label="Full Name" name="fullName" value={profile.fullName || ''} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} disabled={!isEditing} />
                        <Input id="email" label="Email Address" name="email" type="email" value={profile.email || ''} onChange={(e) => setProfile({ ...profile, email: e.target.value })} disabled={!isEditing} />
                        <Input id="phone" label="Phone Number" name="phone" value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} disabled={!isEditing} />
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                            <div className="flex items-center gap-2">
                                <textarea id="address" name="address" rows="3" className="flex-grow px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600" value={profile.address || ''} onChange={(e) => setProfile({ ...profile, address: e.target.value })} disabled={!isEditing || isFetchingLocation} placeholder="Click button to fetch or enter manually." />
                                {isEditing && (<Button type="button" variant="secondary" onClick={handleFetchLocation} disabled={isFetchingLocation} className="shrink-0"><MapPin size={18} className={isFetchingLocation ? 'animate-pulse' : ''} /></Button>)}
                            </div>
                        </div>
                        {isEditing && (<div className="flex justify-end gap-3 pt-4"><Button variant="secondary" onClick={handleCancel}>Cancel</Button><Button onClick={handleSave}>Save Changes</Button></div>)}
                    </div>
                </div>
            </Card>
        </div>
    );
};

const ChatPage = ({ currentUser }) => {
    const [currentMessage, setCurrentMessage] = useState("");
    const [messageList, setMessageList] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const chatBodyRef = useRef(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const room = currentUser?._id ? `chat-${currentUser._id}` : null;
    const authorName = currentUser?.fullName || 'Customer';
    const authorId = currentUser?._id || null;
    useEffect(() => {
        if (!room || !authorId) return;
        setIsHistoryLoading(true);
        setMessageList([]);
        socket.emit("join_room", { roomName: room, userId: authorId });
        const historyListener = (history) => {
            if ((history.length > 0 && history[0].room === room) || history.length === 0) {
                setMessageList(history);
            }
            setIsHistoryLoading(false);
        };
        socket.on("chat_history", historyListener);
        const messageListener = (data) => {
            if (data.room === room) { setMessageList((list) => [...list, data]); }
        };
        socket.on("receive_message", messageListener);
        return () => {
            socket.off("chat_history", historyListener);
            socket.off("receive_message", messageListener);
        };
    }, [room, authorId]);
    useEffect(() => {
        if (chatBodyRef.current) { chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight; }
    }, [messageList]);
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            if (file.type.startsWith('image/')) { setPreviewUrl(URL.createObjectURL(file)); }
            else { setPreviewUrl(null); }
        }
        event.target.value = null;
    };
    const handleRemovePreview = () => { setSelectedFile(null); setPreviewUrl(null); };
    const sendMessage = async () => {
        if ((currentMessage.trim() === "" && !selectedFile) || !room || !authorId) return;
        if (selectedFile) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('room', room);
            formData.append('author', authorName);
            formData.append('authorId', authorId);
            if (currentMessage.trim() !== '') { formData.append('message', currentMessage); }
            try {
                await apiFetchUser('/chat/upload', { method: 'POST', body: formData });
            } catch (error) { toast.error(`File upload failed: ${error.message}`); }
            finally { setIsUploading(false); handleRemovePreview(); setCurrentMessage(''); }
        } else {
            const messageData = { room, author: authorName, authorId, message: currentMessage };
            await socket.emit("send_message", messageData);
            setCurrentMessage("");
        }
    };
    const handleClearChat = async () => {
        try {
            await apiFetchUser('/chat/clear', { method: 'PUT' });
            toast.success("Your chat history has been cleared.");
            setMessageList([]);
        } catch (error) {
            toast.error(error.message || "Failed to clear chat history.");
        } finally {
            setConfirmOpen(false);
        }
    };
    const renderFileContent = (msg) => {
        if (msg.fileType?.startsWith('image/')) {
            return (<a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="block"><img src={msg.fileUrl} alt={msg.fileName || 'Sent Image'} className="max-w-xs rounded-lg mt-1" /></a>);
        }
        return (<a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" download={msg.fileName} className="flex items-center gap-3 bg-black/10 dark:bg-white/10 p-3 rounded-lg hover:bg-black/20 dark:hover:bg-white/20 transition-colors mt-1"><FileText size={32} className="flex-shrink-0" /><span className="truncate font-medium">{msg.fileName || 'Download File'}</span></a>);
    };
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Live Chat with Admin</h1>
            <Card className="p-0 flex flex-col" style={{ height: 'calc(80vh - 2rem)' }}>
                <div className="p-3 border-b dark:border-gray-700 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <img src="/motofix-removebg-preview.png" alt="Support" className="w-10 h-10 rounded-full object-contain bg-gray-100 dark:bg-gray-900 p-1" />
                        <div><h3 className="font-semibold">MotoFix Support</h3><p className="text-sm text-gray-500 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500"></span>Online</p></div>
                    </div>
                    <Button variant="danger" onClick={() => setConfirmOpen(true)} className="!px-2 !py-1 text-xs !gap-1" disabled={messageList.length === 0}><Trash2 size={14} /> Clear Chat</Button>
                </div>
                <div className="flex-grow overflow-y-auto p-4 flex flex-col" ref={chatBodyRef}>
                    {isHistoryLoading ? (<div className="m-auto text-center text-gray-500 dark:text-gray-400"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div><p>Loading chat history...</p></div>)
                        : messageList.length === 0 ? (<div className="m-auto text-center text-gray-500 dark:text-gray-400 px-6"><MessageSquare size={48} className="mx-auto text-gray-400" /><h3 className="mt-2 text-xl font-semibold">Welcome to MotoFix Support!</h3><p className="mt-1 text-sm">Feel free to ask any questions about our services or your bookings. We're here to help you.</p></div>)
                            : (<div className="space-y-1">{messageList.map((msg, index) => {
                                const isUserMessage = msg.authorId === authorId;
                                const prevMsg = messageList[index - 1]; const nextMsg = messageList[index + 1];
                                const isFirstInGroup = !prevMsg || prevMsg.authorId !== msg.authorId;
                                const isLastInGroup = !nextMsg || nextMsg.authorId !== msg.authorId;
                                return (
                                    <div key={index} className={`flex items-end gap-2 ${isUserMessage ? 'justify-end' : 'justify-start'}`}>
                                        {!isUserMessage && (<div className="w-8 flex-shrink-0 self-end">{isLastInGroup && <img src="/motofix-removebg-preview.png" alt="p" className="w-7 h-7 rounded-full object-contain bg-gray-100 dark:bg-gray-900 p-0.5" />}</div>)}
                                        <div className={`py-2 px-3 max-w-md ${isUserMessage ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'} ${isFirstInGroup && isLastInGroup ? 'rounded-2xl' : ''} ${isUserMessage ? `${isFirstInGroup ? 'rounded-t-2xl rounded-bl-2xl' : 'rounded-l-2xl'} ${isLastInGroup ? 'rounded-b-2xl' : ''} ${!isFirstInGroup && !isLastInGroup ? 'rounded-l-2xl rounded-r-md' : ''} ${isFirstInGroup && !isLastInGroup ? 'rounded-tr-md' : ''} ${!isFirstInGroup && isLastInGroup ? 'rounded-br-md' : ''}` : `${isFirstInGroup ? 'rounded-t-2xl rounded-br-2xl' : 'rounded-r-2xl'} ${isLastInGroup ? 'rounded-b-2xl' : ''} ${!isFirstInGroup && !isLastInGroup ? 'rounded-r-2xl rounded-l-md' : ''} ${isFirstInGroup && !isLastInGroup ? 'rounded-tl-md' : ''} ${!isFirstInGroup && isLastInGroup ? 'rounded-bl-md' : ''}`}`}>
                                            {msg.fileUrl && renderFileContent(msg)}
                                            {msg.message && <p className="text-md" style={{ overflowWrap: 'break-word' }}>{msg.message}</p>}
                                            <p className={`text-xs text-right mt-1 opacity-70`}>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>);
                            })}</div>)}
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    {(previewUrl || selectedFile) && (<div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-between">{previewUrl ? <img src={previewUrl} alt="Preview" className="h-16 w-16 object-cover rounded" /> : <div className="flex items-center gap-2 text-gray-500"><FileText /><span>{selectedFile.name}</span></div>}<button onClick={handleRemovePreview} className="text-gray-500 hover:text-red-500"><XCircle size={20} /></button></div>)}
                    <div className="flex items-center gap-3">
                        <div className="flex"><input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" /><input type="file" ref={cameraInputRef} onChange={handleFileChange} className="hidden" accept="image/*" capture="environment" /><button onClick={() => fileInputRef.current.click()} className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"><Paperclip size={22} /></button><button onClick={() => cameraInputRef.current.click()} className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"><Camera size={22} /></button></div>
                        <input type="text" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} onKeyPress={(e) => e.key === "Enter" && !isUploading && sendMessage()} placeholder="Message..." className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border-2 border-transparent rounded-full focus:ring-blue-500 focus:border-blue-500 transition" disabled={isUploading} />
                        <Button onClick={sendMessage} disabled={isUploading || (!currentMessage.trim() && !selectedFile)} className="!rounded-full !w-12 !h-12 !p-0">{isUploading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Send size={20} />}</Button>
                    </div>
                </div>
            </Card>
            <ConfirmationModal isOpen={isConfirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleClearChat} title="Clear Chat History" message="Are you sure you want to clear your chat history? This action cannot be undone and will not affect the admin's view." confirmText="Yes, Clear" />
        </div>
    );
};

const UserNavLink = ({ page, icon: Icon, children, activePage, onLinkClick, badgeCount }) => {
    const isActive = activePage === page;
    return (
        <a href={`#/user/${page}`} onClick={onLinkClick} className={`relative flex items-center gap-4 px-4 py-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-blue-600 text-white font-semibold shadow-lg' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            <Icon size={22} />
            <span className="text-md">{children}</span>
            {badgeCount > 0 && (<span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{badgeCount}</span>)}
        </a>
    );
};

const UserSidebarContent = ({ activePage, onLinkClick, onLogoutClick, onMenuClose, unreadChatCount }) => {
    const handleLogoClick = () => { window.location.hash = '#/user/home'; if (onMenuClose) onMenuClose(); };
    return (
        <>
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer" onClick={handleLogoClick} title="Go to Home"><img src="/motofix-removebg-preview.png" alt="MotoFix Logo" className="h-20 w-auto hover:opacity-80 transition-opacity duration-200" /></div>
                {onMenuClose && <button onClick={onMenuClose} className="lg:hidden text-gray-500 dark:text-gray-400"><X size={24} /></button>}
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                <UserNavLink page="home" icon={Home} activePage={activePage} onLinkClick={onLinkClick}>Home</UserNavLink>
                <UserNavLink page="dashboard" icon={LayoutDashboard} activePage={activePage} onLinkClick={onLinkClick}>Dashboard</UserNavLink>
                <UserNavLink page="bookings" icon={CalendarDays} activePage={activePage} onLinkClick={onLinkClick}>My Bookings</UserNavLink>
                <UserNavLink page="my-payments" icon={CreditCard} activePage={activePage} onLinkClick={onLinkClick}>My Payments</UserNavLink>
                <UserNavLink page="new-booking" icon={PlusCircle} activePage={activePage} onLinkClick={onLinkClick}>New Booking</UserNavLink>
                <UserNavLink page="profile" icon={User} activePage={activePage} onLinkClick={onLinkClick}>Profile</UserNavLink>
                <UserNavLink page="chat" icon={MessageSquare} activePage={activePage} onLinkClick={onLinkClick} badgeCount={unreadChatCount}>Chat</UserNavLink>
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700"><button onClick={onLogoutClick} className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800"><LogOut size={22} /><span className="text-md">Logout</span></button></div>
        </>
    );
};

// --- Main UserDashboard Component ---

const UserDashboard = () => {
    const { user } = useContext(AuthContext);
    const [activePage, setActivePage] = useState('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLogoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('userTheme') === 'dark');
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown
    const dropdownRef = useRef(null); // Ref for dropdown to detect outside clicks

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user) return;
            try {
                const profileResponse = await apiFetchUser('/profile');
                const profileData = await profileResponse.json();
                setCurrentUser(profileData.data);
                const unreadResponse = await apiFetchUser('/chat/unread-count');
                const unreadData = await unreadResponse.json();
                setUnreadChatCount(unreadData.count || 0);
            } catch (error) {
                if (error.message.includes('Unauthorized') || error.message.includes('token')) {
                    handleLogoutConfirm();
                }
            }
        };
        fetchInitialData();
    }, [user]);

    useEffect(() => {
        if (!currentUser) return;

        const notificationListener = (data) => {
            const currentChatRoom = `chat-${currentUser._id}`;
            if (data.room === currentChatRoom && window.location.hash !== '#/user/chat') {
                setUnreadChatCount(prevCount => prevCount + 1);
            }
        };

        const readListener = () => {
            setUnreadChatCount(0);
        };
        
        const bookingStatusListener = (data) => {
            toast.info(data.message, {
                position: "top-right",
                autoClose: 7000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: isDarkMode ? "dark" : "light",
            });
            if (window.location.hash.includes('#/user/bookings')) {
                window.dispatchEvent(new CustomEvent('refreshBookings'));
            }
        };

        socket.on('new_message_notification', notificationListener);
        socket.on('messages_read_by_user', readListener);
        socket.on('booking_status_update', bookingStatusListener);

        return () => {
            socket.off('new_message_notification', notificationListener);
            socket.off('messages_read_by_user', readListener);
            socket.off('booking_status_update', bookingStatusListener);
        };
    }, [currentUser, isDarkMode]);

    useEffect(() => {
        document.title = unreadChatCount > 0 ? `(${unreadChatCount}) MotoFix Customer` : 'MotoFix Customer';
    }, [unreadChatCount]);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
        localStorage.setItem('userTheme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    useEffect(() => {
        const handleHashChange = () => {
            const path = window.location.hash.replace('#/user/', '').split('?')[0];
            let page = path || 'home';
            if (path.startsWith('edit-booking/')) { page = 'edit-booking'; }
            else if (path.startsWith('service-details/')) { page = 'service-details'; }
            setActivePage(page);
        };
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange();
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleDiscountApplied = async (newPoints) => {
        const response = await apiFetchUser('/profile');
        const data = await response.json();
        setCurrentUser(data.data);
    };

    const handleLogoutConfirm = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    // Function to handle navigation from dropdown
    const handleDropdownNavigation = (page) => {
        window.location.hash = `#/user/${page}`;
        setIsDropdownOpen(false); // Close dropdown after navigation
    };

    const renderPage = () => {
        if (!currentUser) {
            return <div className="text-center p-12">Loading User Data...</div>;
        }
        switch (activePage) {
            case 'home': return <UserServiceHomePage currentUser={currentUser} />;
            case 'service-details': return <ServiceDetailPage />;
            case 'dashboard': return <UserDashboardPage />;
            case 'bookings': return <UserBookingsPage />;
            case 'new-booking': return <NewBookingPage />;
            case 'my-payments': return <MyPaymentsPage currentUser={currentUser} loyaltyPoints={currentUser.loyaltyPoints} onDiscountApplied={handleDiscountApplied} />;
            case 'edit-booking': return <EditBookingPage />;
            case 'profile': return <UserProfilePage currentUser={currentUser} setCurrentUser={setCurrentUser} />;
            case 'chat': return <ChatPage currentUser={currentUser} />;
            default:
                window.location.hash = '#/user/home';
                return <UserServiceHomePage currentUser={currentUser} />;
        }
    };

    const handleImageError = (e) => {
        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullName || 'U')}&background=e2e8f0&color=4a5568&size=40`;
    };
    const profilePictureSrc = currentUser?.profilePicture ? `http://localhost:5050/${currentUser.profilePicture}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullName || 'U')}&background=e2e8f0&color=4a5568&size=40`;

    return (
        <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100`}>
            <div className={`fixed inset-0 z-40 flex lg:hidden transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="w-72 bg-white dark:bg-gray-800 shadow-lg flex flex-col">
                    <UserSidebarContent activePage={activePage} onLinkClick={() => setIsSidebarOpen(false)} onLogoutClick={() => { setIsSidebarOpen(false); setLogoutConfirmOpen(true); }} onMenuClose={() => setIsSidebarOpen(false)} unreadChatCount={unreadChatCount} />
                </div>
                <div className="flex-1 bg-black bg-opacity-50" onClick={() => setIsSidebarOpen(false)}></div>
            </div>
            <aside className="w-72 bg-white dark:bg-gray-800 shadow-md hidden lg:flex flex-col flex-shrink-0">
                <UserSidebarContent activePage={activePage} onLinkClick={() => {}} onLogoutClick={() => setLogoutConfirmOpen(true)} unreadChatCount={unreadChatCount} />
            </aside>
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center">
                    <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-gray-600 dark:text-gray-300"><Menu size={28} /></button>
                    <div className="hidden lg:block" /> {/* This div keeps the right content aligned */}
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-gray-600 dark:text-gray-300 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        {/* Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                <img key={profilePictureSrc} src={profilePictureSrc} alt="User" className="w-10 h-10 rounded-full object-cover" onError={handleImageError} />
                                <span className="font-semibold text-sm hidden md:block">{currentUser?.fullName}</span>
                                <ChevronDown size={16} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-50">
                                    <a
                                        href="#/user/profile"
                                        onClick={() => handleDropdownNavigation('profile')}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                    >
                                        <User size={18} /> Profile
                                    </a>
                                    <button
                                        onClick={() => { setIsDropdownOpen(false); setLogoutConfirmOpen(true); }}
                                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800"
                                    >
                                        <LogOut size={18} /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6 md:p-8 flex flex-col">
                    {renderPage()}
                </div>
            </main>
            <ConfirmationModal isOpen={isLogoutConfirmOpen} onClose={() => setLogoutConfirmOpen(false)} onConfirm={handleLogoutConfirm} title="Confirm Logout" message="Are you sure you want to logout?" confirmText="Logout" confirmButtonVariant="danger" Icon={LogOut} />

            {/* --- AI CHATBOT INTEGRATION --- */}
            {/* The GeminiChatbot is placed here to be available on all user pages */}
            <GeminiChatbot />
        </div>
    );
};

export default UserDashboard;