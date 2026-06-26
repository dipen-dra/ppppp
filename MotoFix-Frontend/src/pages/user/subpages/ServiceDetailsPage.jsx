import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Wrench, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { apiFetchUser } from '../../../services/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

const LoadingSpinner = () => (
    <div className="flex flex-col justify-center items-center py-32 space-y-4">
        <div className="w-10 h-10 border-4 border-[rgba(245,192,0,0.2)] border-t-[#F5C000] rounded-full animate-spin"></div>
        <p className="text-sm text-[#4A4A65] font-semibold animate-pulse">Running Diagnostics...</p>
    </div>
);

const ServiceDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchServiceDetails = async () => {
            setIsLoading(true);
            try {
                const response = await apiFetchUser(`/services/${id}`);
                const data = await response.json();
                if (data.data) {
                    setService(data.data);
                } else {
                    throw new Error('Service not found.');
                }
            } catch (error) {
                toast.error(error.message || "Failed to fetch service details.");
                navigate('/user/dashboard');
            } finally {
                setIsLoading(false);
            }
        };

        fetchServiceDetails();
    }, [id, navigate]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!service) {
        return null;
    }
    
    const placeholderImage = `https://placehold.co/1200x600/f5f3e7/111118?text=${encodeURIComponent(service.name)}`;
    const imageUrl = service.image ? `http://localhost:5050/${service.image}` : placeholderImage;

    return (
        <div className="max-w-4xl mx-auto space-y-6 text-[#111118]">
            <Button 
                variant="secondary" 
                onClick={() => navigate('/user/dashboard')} 
                className="!gap-1.5 shadow-sm text-xs py-2 px-4 font-semibold !bg-[#F5F3E7] hover:!bg-black/05 text-[#111118] transition-all duration-200"
            >
                <ArrowLeft size={14} />
                Back to Dashboard
            </Button>

            <Card className="bg-white border border-black/08 rounded-2xl p-0 overflow-hidden relative shadow-sm">
                {/* Visual Banner Container */}
                <div className="relative h-64 md:h-96 overflow-hidden group">
                    <img 
                        src={imageUrl} 
                        alt={service.name} 
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-all duration-[800ms]"
                        onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6 text-white text-left">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase bg-[#F5C000] text-[#0D0D14] mb-3 shadow-md">
                            <Wrench size={10} />
                            OFFICIAL SERVICE PACKAGE
                        </span>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none text-white">
                            {service.name}
                        </h1>
                    </div>
                </div>

                <div className="p-6 md:p-10 space-y-8 bg-white">
                    {/* Description Text */}
                    <div className="space-y-3 text-left">
                        <h3 className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider border-b border-black/07 pb-1.5">
                            Service Specifications Overview
                        </h3>
                        <p className="text-[#4A4A65] text-base leading-relaxed font-normal pt-1">
                            {service.description}
                        </p>
                    </div>

                    {/* Features List Section */}
                    <div className="space-y-4 border-t border-black/07 pt-6 text-left">
                        <h3 className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider">
                            Inclusions & Workshop Deliverables
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {[
                                "Complete mechanical safety diagnostic check",
                                "Engine oil quality filter optimization",
                                "Premium synthetic lubricants replenishment",
                                "Comprehensive washing & exterior polish treatment",
                                "Tire tread depth pressure assessment",
                                "Braking response pad friction inspection"
                            ].map((inclusion, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <span className="w-5 h-5 rounded-full bg-[#F5C000]/10 text-[#B8860B] flex items-center justify-center shrink-0 mt-0.5 border border-[#F5C000]/20 text-xs font-bold">
                                        ✓
                                    </span>
                                    <span className="text-sm text-[#4A4A65] leading-relaxed font-medium">
                                        {inclusion}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Guarantee Panel */}
                    <div className="bg-[#FFFCEE] rounded-xl border border-[#F5C000]/20 p-5 flex gap-4 items-start text-left">
                        <ShieldCheck size={22} className="text-[#B8860B] shrink-0 mt-0.5" />
                        <div>
                            <h5 className="text-xs font-bold text-[#B8860B] uppercase tracking-widest">
                                MOTOFIX DYNAMIC WARRANTY
                            </h5>
                            <p className="text-xs text-[#4A4A65] mt-1 leading-relaxed">
                                This package qualifies for our full 1-week dynamic warranty protection covering all spare parts, lubricants, and mechanic labor hours logged on the shop floor.
                            </p>
                        </div>
                    </div>

                    {/* Pricing & Booking CTA Area */}
                    <div className="bg-[#FDFDF8] border border-black/08 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 mt-8 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(45deg,#F5C000_25%,transparent_25%,transparent_50%,#F5C000_50%,#F5C000_75%,transparent_75%,transparent)] bg-[length:40px_40px] pointer-events-none"></div>

                        <div className="text-center md:text-left z-10">
                            <p className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider leading-none">Estimated Standard Cost</p>
                            <span className="text-3xl font-black text-[#B8860B] flex items-center justify-center md:justify-start gap-2 mt-2">
                                रु{service.price}
                            </span>
                        </div>
                        
                        <Link to={`/user/book-service/${service._id}`} className="w-full md:w-auto z-10">
                           <Button className="w-full md:w-auto h-12 !px-8 text-sm font-semibold text-[#0D0D14] bg-gradient-to-r from-[#F5C000] to-[#E6B000] shadow-[0_4px_16px_rgba(245,192,0,0.3)] hover:shadow-[0_6px_24px_rgba(245,192,0,0.45)] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2">
                               <ClipboardCheck size={18} />
                               Book Service Package
                           </Button>
                        </Link>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ServiceDetailsPage;
