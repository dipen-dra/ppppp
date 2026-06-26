import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wrench, Calendar, FileText, MapPin, Truck } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiFetchUser } from '../../../services/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const EditBookingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ 
        serviceId: '', 
        bikeModel: '', 
        date: '', 
        notes: '',
        requestedPickupDropoff: false,
        pickupAddress: '',
        dropoffAddress: ''
    });
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isFetchingPickup, setIsFetchingPickup] = useState(false);
    const [isFetchingDropoff, setIsFetchingDropoff] = useState(false);
    const [pickupCoordinates, setPickupCoordinates] = useState({ lat: 27.7172, lng: 85.3240 });
    const [dropoffCoordinates, setDropoffCoordinates] = useState({ lat: 27.7000, lng: 85.3000 });

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const servicesRes = await apiFetchUser('/services');
                const { data: allServices } = await servicesRes.json();
                setServices(allServices || []);

                const bookingRes = await apiFetchUser(`/bookings/${id}`);
                const { data: booking } = await bookingRes.json();

                if (booking) {
                    if (booking.isPaid || booking.discountApplied || booking.status !== 'Pending') {
                        toast.error("This booking cannot be edited.");
                        navigate('/user/bookings');
                        return;
                    }
                    const service = (allServices || []).find(s => s.name === booking.serviceType);
                    setFormData({
                        serviceId: service ? service._id : '',
                        bikeModel: booking.bikeModel,
                        date: new Date(booking.date).toISOString().split('T')[0],
                        notes: booking.notes,
                        requestedPickupDropoff: booking.requestedPickupDropoff || false,
                        pickupAddress: booking.pickupAddress || '',
                        dropoffAddress: booking.dropoffAddress || ''
                    });
                    if (booking.pickupCoordinates) {
                        setPickupCoordinates(booking.pickupCoordinates);
                    }
                    if (booking.dropoffCoordinates) {
                        setDropoffCoordinates(booking.dropoffCoordinates);
                    }
                } else {
                    throw new Error("Booking not found.");
                }
            } catch (err) {
                toast.error(err.message || "Failed to load booking data.");
                navigate('/user/bookings');
            } finally {
                setIsLoading(false);
            }
        };
        if (id) fetchInitialData();
    }, [id, navigate]);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleFetchLocation = (type) => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            return;
        }
        if (type === 'pickup') setIsFetchingPickup(true);
        if (type === 'dropoff') setIsFetchingDropoff(true);
        
        toast.info("Accessing GPS satellites for high-accuracy location pin...");
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    if (!response.ok) throw new Error('Failed to resolve coordinates to physical street address.');
                    const data = await response.json();
                    
                    if (data && data.display_name) {
                        const resolvedAddress = data.display_name;
                        if (type === 'pickup') {
                            setFormData(prev => ({ ...prev, pickupAddress: resolvedAddress }));
                            setPickupCoordinates({ lat: latitude, lng: longitude });
                            toast.success("Pickup location pinned successfully!");
                        } else {
                            setFormData(prev => ({ ...prev, dropoffAddress: resolvedAddress }));
                            setDropoffCoordinates({ lat: latitude, lng: longitude });
                            toast.success("Drop-off location pinned successfully!");
                        }
                    } else {
                        throw new Error('Address not found at geocode location.');
                    }
                } catch (error) {
                    toast.error(error.message || "Failed to resolve coordinates.");
                } finally {
                    if (type === 'pickup') setIsFetchingPickup(false);
                    if (type === 'dropoff') setIsFetchingDropoff(false);
                }
            },
            (error) => {
                toast.error("GPS satellite permission denied. Please allow location access.");
                if (type === 'pickup') setIsFetchingPickup(false);
                if (type === 'dropoff') setIsFetchingDropoff(false);
            },
            { enableHighAccuracy: true, timeout: 8500 }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const submitData = {
                ...formData,
                pickupCoordinates: formData.requestedPickupDropoff ? pickupCoordinates : undefined,
                dropoffCoordinates: formData.requestedPickupDropoff ? dropoffCoordinates : undefined
            };
            const response = await apiFetchUser(`/bookings/${id}`, {
                method: 'PUT',
                body: JSON.stringify(submitData),
            });
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || "Failed to update booking.");
            }
            
            toast.success(data.message || "Booking updated successfully!");
            navigate('/user/bookings');
        } catch (err) {
            toast.error(err.message || "Failed to update booking.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center py-32 space-y-4">
                <div className="w-10 h-10 border-4 border-[rgba(245,192,0,0.2)] border-t-[#F5C000] rounded-full animate-spin"></div>
                <p className="text-sm text-[#4A4A65] font-semibold animate-pulse">Loading Booking Specifications...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-3xl mx-auto text-[#111118]">
            {/* Header section with back option */}
            <div className="flex items-center gap-4 border-b border-black/08 pb-5">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2.5 rounded-xl bg-[#FDFDF8] hover:bg-[#F5F3E7] border border-black/10 text-[#4A4A65] hover:text-[#B8860B] transition-all duration-200 cursor-pointer"
                    title="Go Back"
                >
                    <ArrowLeft size={16} />
                </button>
                <div>
                    <h1 className="text-3xl font-black tracking-tight leading-none">
                        Revise Booking Sheet
                    </h1>
                    <p className="text-xs text-[#8A8AA8] mt-1.5">
                        Modify your requested schedule, vehicle description details, or service tier category.
                    </p>
                </div>
            </div>

            <Card className="bg-white border border-black/08 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-sm">
                {/* Glowing side line */}
                <div className="absolute top-0 left-0 w-1 h-full bg-[#F5C000]" />
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="serviceId" className="block text-xs font-bold text-[#4A4A65] uppercase tracking-wider mb-1.5">
                            Service Category Blueprint*
                        </label>
                        <select 
                            id="serviceId" 
                            name="serviceId" 
                            value={formData.serviceId} 
                            onChange={handleChange} 
                            required 
                            className="w-full px-4 py-2.5 bg-[#FDFDF8] border border-black/10 focus:border-[#F5C000] focus:outline-none focus:ring-1 focus:ring-[#F5C000]/30 text-[#111118] text-sm rounded-xl placeholder:text-[#8A8AA8] transition-colors cursor-pointer"
                        >
                            {services.map(service => (
                                <option key={service._id} value={service._id}>
                                    {service.name} (रु{service.price})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Input 
                            id="bikeModel" 
                            name="bikeModel" 
                            label="Bike Model Specs*" 
                            value={formData.bikeModel} 
                            onChange={handleChange} 
                            required 
                            placeholder="e.g. Pulsar 220F"
                        />
                        <Input 
                            id="date" 
                            name="date" 
                            label="Rescheduled Date*" 
                            type="date" 
                            value={formData.date} 
                            onChange={handleChange} 
                            required 
                            min={new Date().toISOString().split("T")[0]} 
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="notes" className="block text-xs font-bold text-[#4A4A65] uppercase tracking-wider">
                            Diagnosis Log Symptoms / Notes
                        </label>
                        <textarea 
                            id="notes" 
                            name="notes" 
                            rows="4" 
                            value={formData.notes || ''} 
                            onChange={handleChange} 
                            className="w-full px-4 py-2.5 bg-[#FDFDF8] border border-black/10 focus:border-[#F5C000] focus:outline-none focus:ring-1 focus:ring-[#F5C000]/30 text-[#111118] text-sm rounded-xl placeholder:text-[#8A8AA8] transition-colors"
                            placeholder="Explain the problems you want serviced on the workshop floor..."
                        ></textarea>
                    </div>

                    {/* Valet door-to-door switch & address layout */}
                    <div className="space-y-4 pt-4 border-t border-black/07">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-[#111118] uppercase tracking-wider">
                                    Valet Doorstep Logistics
                                </p>
                                <p className="text-[11px] text-[#8A8AA8] mt-0.5">
                                    Toggle professional valet courier vehicle retrieval & hand-back service
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    name="requestedPickupDropoff" 
                                    checked={formData.requestedPickupDropoff} 
                                    onChange={handleChange} 
                                    className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-[#FDFDF8] peer-focus:outline-none rounded-full border border-black/10 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-[#8A8AA8] after:border-[#8A8AA8] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:bg-[#F5C000] peer-checked:after:border-[#F5C000] peer-checked:border-[#F5C000]/50"></div>
                            </label>
                        </div>

                        {formData.requestedPickupDropoff && (
                            <div className="p-4 bg-[#FDFDF8] border border-black/08 rounded-2xl space-y-4 animate-in fade-in duration-200">
                                <p className="text-[10px] text-[#B8860B] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <Truck size={14} /> Valet Street Addresses
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5 w-full">
                                        <label htmlFor="pickupAddress" className="block text-xs font-semibold uppercase tracking-widest text-[#4A4A65]">
                                            Pickup Street Address*
                                        </label>
                                        <div className="flex gap-2">
                                            <input 
                                                id="pickupAddress" 
                                                name="pickupAddress"
                                                type="text" 
                                                className="w-full px-4 py-3 bg-[#FDFDF8] border border-black/10 focus:border-[#F5C000] focus:shadow-[0_0_0_3px_rgba(245,192,0,0.12)] focus:outline-none text-[#111118] text-sm rounded-xl placeholder:text-[#8A8AA8] transition-all hover:border-[rgba(0,0,0,0.18)] disabled:opacity-50 disabled:cursor-not-allowed"
                                                value={formData.pickupAddress}
                                                onChange={handleChange}
                                                placeholder="e.g. Gongabu, Kathmandu"
                                                disabled={isFetchingPickup}
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => handleFetchLocation('pickup')} 
                                                disabled={isFetchingPickup} 
                                                className="shrink-0 rounded-xl border border-black/10 hover:border-[#F5C000] bg-[#FDFDF8] hover:bg-[#F5F3E7] text-[#4A4A65] hover:text-[#B8860B] transition-colors w-12 h-12 flex items-center justify-center cursor-pointer disabled:opacity-50"
                                                title="Pin Pickup via GPS Satellite"
                                            >
                                                <MapPin size={18} className={isFetchingPickup ? 'animate-bounce text-[#B8860B]' : ''} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 w-full">
                                        <label htmlFor="dropoffAddress" className="block text-xs font-semibold uppercase tracking-widest text-[#4A4A65]">
                                            Drop-off Delivery Address*
                                        </label>
                                        <div className="flex gap-2">
                                            <input 
                                                id="dropoffAddress" 
                                                name="dropoffAddress"
                                                type="text" 
                                                className="w-full px-4 py-3 bg-[#FDFDF8] border border-black/10 focus:border-[#F5C000] focus:shadow-[0_0_0_3px_rgba(245,192,0,0.12)] focus:outline-none text-[#111118] text-sm rounded-xl placeholder:text-[#8A8AA8] transition-all hover:border-[rgba(0,0,0,0.18)] disabled:opacity-50 disabled:cursor-not-allowed"
                                                value={formData.dropoffAddress}
                                                onChange={handleChange}
                                                placeholder="e.g. Gongabu, Kathmandu"
                                                disabled={isFetchingDropoff}
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => handleFetchLocation('dropoff')} 
                                                disabled={isFetchingDropoff} 
                                                className="shrink-0 rounded-xl border border-black/10 hover:border-[#F5C000] bg-[#FDFDF8] hover:bg-[#F5F3E7] text-[#4A4A65] hover:text-[#B8860B] transition-colors w-12 h-12 flex items-center justify-center cursor-pointer disabled:opacity-50"
                                                title="Pin Drop-off via GPS Satellite"
                                            >
                                                <MapPin size={18} className={isFetchingDropoff ? 'animate-bounce text-[#B8860B]' : ''} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-black/07">
                        <Button 
                            variant="secondary" 
                            type="button" 
                            onClick={() => navigate('/user/bookings')}
                            className="!px-6 !py-2.5 text-xs font-semibold !bg-[#F5F3E7] hover:!bg-black/05 text-[#111118] transition-all duration-200"
                            disabled={isSubmitting}
                        >
                            Cancel Changes
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="!px-6 !py-2.5 text-xs font-semibold text-[#0D0D14] bg-gradient-to-r from-[#F5C000] to-[#E6B000]"
                        >
                            {isSubmitting ? 'Saving Specifications...' : 'Save Revisions'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default EditBookingPage;