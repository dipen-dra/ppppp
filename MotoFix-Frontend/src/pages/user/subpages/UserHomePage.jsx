import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Wrench, Tag, Info } from 'lucide-react';

import { apiFetchUser } from '../../../services/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

// --- Reusable Service Card Component ---
const ServiceCard = ({ service }) => {
    const placeholderImage = `https://placehold.co/600x400/f5f3e7/111118?text=${encodeURIComponent(service.name)}`;
    const imageUrl = service.image ? `http://localhost:5050/${service.image}` : placeholderImage;

    return (
        <Card className="flex flex-col overflow-hidden p-0 rounded-2xl border border-black/08 hover:border-[#F5C000]/40 shadow-sm hover:shadow-[0_4px_20px_rgba(245,192,0,0.12)] transition-all duration-200 group bg-white">
            <div className="relative h-44 overflow-hidden">
                <img 
                    src={imageUrl} 
                    alt={service.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                />
                <div className="absolute top-0 left-0 h-1 w-12 bg-[#F5C000] group-hover:w-24 transition-all duration-300"></div>
            </div>
            <div className="p-5 flex flex-col flex-grow bg-white">
                <h3 className="text-lg font-black text-[#111118] mb-1.5 flex items-center gap-2">
                    <Wrench size={16} className="text-[#F5C000]" />
                    {service.name}
                </h3>
                <p className="text-[#4A4A65] text-xs leading-relaxed flex-grow mb-5 line-clamp-3">
                    {service.description}
                </p>
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-black/07">
                    <span className="text-lg font-black text-[#B8860B]">
                        रु{service.price}
                    </span>
                    <Link to={`/user/service/${service._id}`}>
                        <Button variant="secondary" className="px-3.5 py-1.5 text-xs font-semibold !bg-[#F5F3E7] hover:!bg-[#F5C000] hover:text-[#0D0D14] text-[#111118] transition-all duration-200 flex items-center gap-1">
                            <Info size={13} />
                            Details
                        </Button>
                    </Link>
                </div>
            </div>
        </Card>
    );
};

// --- Main User Home Page Component ---
const UserHomePage = () => {
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
                toast.error(error.message || "Failed to fetch available services.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchServices();
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
            <div className="border-b border-black/08 pb-5">
                <h1 className="text-3xl font-black text-[#111118] tracking-tight uppercase">
                    Available Workshop Services
                </h1>
                <p className="text-sm text-[#4A4A65] mt-1.5 max-w-xl">
                    Choose from our range of professional maintenance programs designed to keep your bike in perfect condition.
                </p>
            </div>
            
            {services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
                    {services.map(service => (
                        <ServiceCard key={service._id} service={service} />
                    ))}
                </div>
            ) : (
                <Card className="text-center py-16 border border-black/08 bg-white rounded-2xl shadow-sm">
                    <Wrench size={40} className="mx-auto text-[#8A8AA8] mb-3" />
                    <h3 className="text-lg font-black text-[#111118]">No Active Services</h3>
                    <p className="mt-1.5 text-sm text-[#4A4A65]">
                        We are currently updating our service packages. Please check back later.
                    </p>
                </Card>
            )}
        </div>
    );
};

export default UserHomePage;
