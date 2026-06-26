import React, { useState, useEffect } from 'react';
import { LayoutDashboard, CalendarDays, Wrench, Gift, PlusCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiFetchUser } from '../../../services/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import StatusBadge from '../../../components/ui/Statusbadge';

const UserDashboardPage = () => {
    const [stats, setStats] = useState({ upcomingBookings: 0, completedServices: 0, loyaltyPoints: 0 });
    const [recentBookings, setRecentBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await apiFetchUser('/dashboard-summary');
                const data = await response.json();
                setStats({
                    upcomingBookings: data.data.upcomingBookings,
                    completedServices: data.data.completedServices,
                    loyaltyPoints: data.data.loyaltyPoints || 0
                });
                setRecentBookings(data.data.recentBookings || []);
            } catch (error) {
                toast.error(error.message || "Failed to fetch dashboard summary.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-10 h-10 border-4 border-[rgba(245,192,0,0.2)] border-t-[#F5C000] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-black text-[#111118] tracking-tight">My Dashboard</h1>
                <p className="text-sm text-[#4A4A65] mt-1">Get a quick overview of your bike services, payments, and rewards.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Metric Cards */}
                <Card className="border border-black/07 bg-white hover:border-[#F5C000]/40 shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[rgba(245,192,0,0.15)] border border-[rgba(245,192,0,0.25)] rounded-2xl">
                            <CalendarDays className="text-[#B8860B]" size={24} />
                        </div>
                        <div>
                            <p className="text-[#8A8AA8] text-xs font-bold uppercase tracking-wider">Upcoming Bookings</p>
                            <p className="text-2xl font-black text-[#111118] mt-0.5">{stats.upcomingBookings}</p>
                        </div>
                    </div>
                </Card>

                <Card className="border border-black/07 bg-white hover:border-[#F5C000]/40 shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.2)] rounded-2xl">
                            <Wrench className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-[#8A8AA8] text-xs font-bold uppercase tracking-wider">Completed Services</p>
                            <p className="text-2xl font-black text-[#111118] mt-0.5">{stats.completedServices}</p>
                        </div>
                    </div>
                </Card>

                <Card className="border border-black/07 bg-white hover:border-[#F5C000]/40 shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[rgba(168,85,247,0.12)] border border-[rgba(168,85,247,0.2)] rounded-2xl">
                            <Gift className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-[#8A8AA8] text-xs font-bold uppercase tracking-wider">Loyalty Points</p>
                            <p className="text-2xl font-black text-[#111118] mt-0.5">{stats.loyaltyPoints}</p>
                        </div>
                    </div>
                </Card>

                {/* Quick CTA booking card */}
                <a href="#/user/new-booking" className="block">
                    <Card className="h-full flex items-center justify-center text-center p-5 bg-gradient-to-br from-[#FFFCEE] to-[#FFF7D1] hover:from-[#FFFAD6] hover:to-[#FFF2BD] border border-dashed border-[#F5C000]/50 hover:border-[#F5C000] rounded-2xl shadow-sm transition-all duration-200">
                        <div className="flex items-center gap-3">
                            <PlusCircle className="text-[#B8860B]" size={24} />
                            <div className="text-left">
                                <h3 className="text-sm font-black text-[#111118]">Book a New Service</h3>
                                <p className="text-xs text-[#4A4A65]">Get your two-wheeler fixed</p>
                            </div>
                        </div>
                    </Card>
                </a>
            </div>

            {/* Recent Activity Table */}
            <Card className="border border-black/08 bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-black/07">
                    <h2 className="text-lg font-black text-[#111118]">Recent Activity</h2>
                    <p className="text-xs text-[#8A8AA8] mt-0.5">Your most recent service and booking updates.</p>
                </div>
                
                <div className="overflow-x-auto">
                    {recentBookings.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#FDFDF8] border-b border-black/07">
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#8A8AA8]">Service</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#8A8AA8]">Bike Model</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#8A8AA8]">Date</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#8A8AA8]">Status</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#8A8AA8] text-right">Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/05">
                                {recentBookings.map(booking => (
                                    <tr key={booking._id} className="hover:bg-[#FDFDF8] transition-colors">
                                        <td className="p-4 font-semibold text-sm text-[#111118]">{booking.serviceType}</td>
                                        <td className="p-4 text-sm text-[#4A4A65]">{booking.bikeModel}</td>
                                        <td className="p-4 text-sm text-[#4A4A65]">{new Date(booking.date).toLocaleDateString()}</td>
                                        <td className="p-4 text-sm"><StatusBadge status={booking.status} /></td>
                                        <td className="p-4 text-sm text-right font-bold text-[#111118]">रु{booking.finalAmount ?? booking.totalCost}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-sm text-[#8A8AA8]">You have no recent bookings.</p>
                            <a href="#/user/new-booking" className="mt-4">
                                <Button className="h-10 !px-5 text-xs font-semibold text-[#0D0D14] bg-gradient-to-r from-[#F5C000] to-[#E6B000]">
                                    Book Your First Service
                                </Button>
                            </a>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default UserDashboardPage;