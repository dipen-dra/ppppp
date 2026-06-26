

import React, { useState, useEffect, useContext, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Menu, Sun, Moon, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';

import { AuthContext } from '../../auth/AuthContext';
import { apiFetchUser } from '../../services/api';
import { socket } from '../../services/socket';

// --- Lazy Load Pages for Better Performance ---
const UserHomePage = lazy(() => import('./subpages/UserHomePage'));
const UserBookingsPage = lazy(() => import('./subpages/MyBookingPage'));
const NewBookingPage = lazy(() => import('./subpages/NewBookingPage'));
const EditBookingPage = lazy(() => import('./subpages/EditBookingPage'));
const MyPaymentsPage = lazy(() => import('./subpages/MyPaymentPage'));
const UserProfilePage = lazy(() => import('./subpages/UserProfilePage'));
const ChatPage = lazy(() => import('./subpages/ChatPage'));
const ServiceDetailsPage = lazy(() => import('./subpages/ServiceDetailsPage'));


// --- Import Non-Lazy Components ---
import UserSidebarContent from './components/UserSidebarContent';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

// --- Loading Spinner Component ---
const LoadingFallback = () => (
    <div className="flex justify-center items-center h-full">
        <div className="w-8 h-8 border-3 border-[rgba(245,192,0,0.2)] border-t-[#F5C000] rounded-full animate-spin"></div>
    </div>
);

const UserDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [activePage, setActivePage] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLogoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('userTheme') === 'dark');
    const [unreadChatCount, setUnreadChatCount] = useState(0);

    // Effect for fetching initial user data and unread chat count
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
                console.error("Failed to fetch initial user data:", error);
                if (error.message.includes('Unauthorized') || error.message.includes('token')) {
                    handleLogoutConfirm();
                }
            }
        };
        fetchInitialData();
    }, [user]);

    // Effect for Socket.IO listeners for chat notifications
    useEffect(() => {
        if (!currentUser) return;
        const room = `chat-${currentUser._id}`;

        const notificationListener = (data) => {
            if (data.room === room && !location.pathname.endsWith('/user/chat')) {
                setUnreadChatCount(prevCount => prevCount + 1);
            }
        };
        const readListener = () => setUnreadChatCount(0);

        socket.on('new_message_notification', notificationListener);
        socket.on('messages_read_by_user', readListener);

        return () => {
            socket.off('new_message_notification', notificationListener);
            socket.off('messages_read_by_user', readListener);
        };
    }, [currentUser, location.pathname]);

    // Effect for managing document title with notification count
    useEffect(() => {
        document.title = unreadChatCount > 0 ? `(${unreadChatCount}) MotoFix Customer` : 'MotoFix Customer';
    }, [unreadChatCount]);

    // Effect for toggling dark mode
    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
        localStorage.setItem('userTheme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    // Effect to derive active page from URL for sidebar highlighting
    useEffect(() => {
        const path = location.pathname.split('/user/')[1] || 'dashboard';
        setActivePage(path.split('/')[0]);
    }, [location.pathname]);

    const handleDiscountApplied = async () => {
        const response = await apiFetchUser('/profile');
        const data = await response.json();
        setCurrentUser(data.data);
    };

    const handleLogoutConfirm = () => {
        logout();
        toast.success("Logged out successfully!");
        navigate('/login');
    };

    const handleImageError = (e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullName || 'U')}&background=e2e8f0&color=4a5568&size=40`; };
    const profilePictureSrc = currentUser?.profilePicture ? `http://localhost:5050/${currentUser.profilePicture}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullName || 'U')}&background=e2e8f0&color=4a5568&size=40`;

    return (
        <div className="flex h-screen font-sans" style={{ background: '#FAFAF5' }}>
            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 z-40 flex lg:hidden transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="w-64 bg-[#F5F3E7] border-r border-black/08 shadow-lg flex flex-col">
                    <UserSidebarContent activePage={activePage} onLogoutClick={() => { setIsSidebarOpen(false); setLogoutConfirmOpen(true); }} onMenuClose={() => setIsSidebarOpen(false)} unreadChatCount={unreadChatCount} />
                </div>
                <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
            </div>

            {/* Desktop Sidebar */}
            <aside className="w-64 bg-[#F5F3E7] border-r border-black/08 hidden lg:flex flex-col flex-shrink-0 shadow-[2px_0_8px_rgba(0,0,0,0.06)]">
                <UserSidebarContent activePage={activePage} onLogoutClick={() => setLogoutConfirmOpen(true)} unreadChatCount={unreadChatCount} />
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="bg-white border-b border-[rgba(0,0,0,0.07)] shadow-[0_1px_8px_rgba(0,0,0,0.05)] px-6 py-3.5 flex justify-between items-center flex-shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-[#4A4A65] hover:text-[#111118] transition-colors">
                            <Menu size={22} />
                        </button>
                        <div className="hidden lg:flex items-center gap-2">
                            <span className="text-xs font-medium text-[#8A8AA8] capitalize">
                                {activePage.charAt(0).toUpperCase() + activePage.slice(1) || 'Dashboard'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 pl-3 border-l border-[rgba(0,0,0,0.08)]">
                            <img
                                key={profilePictureSrc}
                                src={profilePictureSrc}
                                alt="User"
                                className="w-8 h-8 rounded-lg object-cover ring-2 ring-[rgba(245,192,0,0.3)]"
                                onError={handleImageError}
                            />
                            <div className="hidden sm:block">
                                <p className="font-semibold text-sm text-[#111118] leading-tight">{currentUser?.fullName || 'Loading...'}</p>
                                <p className="text-[10px] text-[#8A8AA8] mt-0.5">Customer</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8" style={{ background: '#FAFAF5' }}>
                    <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                            <Route index element={<UserHomePage />} />
                            <Route path="dashboard" element={<UserHomePage />} />
                            <Route path="bookings" element={<UserBookingsPage />} />
                            <Route path="new-booking" element={<NewBookingPage />} />
                            <Route path="edit-booking/:id" element={<EditBookingPage />} />
                            <Route path="my-payments" element={<MyPaymentsPage currentUser={currentUser} loyaltyPoints={currentUser?.loyaltyPoints || 0} onDiscountApplied={handleDiscountApplied} />} />
                            <Route path="profile" element={<UserProfilePage currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
                            <Route path="chat" element={<ChatPage currentUser={currentUser} />} />
                            <Route path="service/:id" element={<ServiceDetailsPage />} />
                            <Route path="book-service/:id" element={<NewBookingPage />} />
                            <Route path="*" element={<Navigate to="/user/dashboard" replace />} />
                        </Routes>
                    </Suspense>
                </div>
            </main>

            <ConfirmationModal isOpen={isLogoutConfirmOpen} onClose={() => setLogoutConfirmOpen(false)} onConfirm={handleLogoutConfirm} title="Confirm Logout" message="Are you sure you want to logout?" confirmText="Logout" confirmButtonVariant="danger" Icon={LogOut} />
        </div>
    );
};

export default UserDashboard;
