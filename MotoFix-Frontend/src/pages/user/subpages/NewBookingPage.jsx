import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    Wrench, 
    ShieldCheck, 
    HelpCircle, 
    ArrowLeft, 
    Sparkles, 
    Bike, 
    Zap, 
    Calendar, 
    ArrowRight, 
    Check, 
    Truck, 
    FileText,
    MapPin
} from 'lucide-react';
import { apiFetchUser } from '../../../services/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const NewBookingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // Step configuration: 1 = Vehicle, 2 = Service, 3 = Schedule, 4 = Confirm
    const [step, setStep] = useState(1);
    
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form inputs state
    const [vehicle, setVehicle] = useState({
        type: 'Motorcycle', // Scooter, Motorcycle, Electric
        make: '',
        model: '',
        year: ''
    });
    
    const [schedule, setSchedule] = useState({
        date: '',
        notes: '',
        requestedPickupDropoff: false,
        pickupAddress: '',
        dropoffAddress: ''
    });

    const [isFetchingPickup, setIsFetchingPickup] = useState(false);
    const [isFetchingDropoff, setIsFetchingDropoff] = useState(false);
    const [pickupCoordinates, setPickupCoordinates] = useState({ lat: 27.7172, lng: 85.3240 });
    const [dropoffCoordinates, setDropoffCoordinates] = useState({ lat: 27.7000, lng: 85.3000 });

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await apiFetchUser('/services');
                const data = await response.json();
                const serviceList = data.data || [];
                setServices(serviceList);

                // Auto-select service if id matches URL param
                if (id) {
                    const matched = serviceList.find(s => s._id === id);
                    if (matched) {
                        setSelectedService(matched);
                    }
                }
            } catch (err) {
                toast.error(err.message || "Could not load services.");
            }
        };
        fetchServices();
    }, [id]);

    const handleServiceSelect = (service) => {
        setSelectedService(service);
    };

    const handleVehicleChange = (e) => {
        setVehicle({ ...vehicle, [e.target.name]: e.target.value });
    };

    const handleScheduleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setSchedule({ ...schedule, [e.target.name]: value });
    };

    // Calculate final billing details
    const servicePrice = selectedService ? selectedService.price : 0;
    const pickupDropoffCost = schedule.requestedPickupDropoff ? 350 : 0; 
    const finalAmount = servicePrice + pickupDropoffCost;

    const nextStep = () => {
        if (step === 1) {
            if (!vehicle.make || !vehicle.model) {
                toast.error("Please specify your vehicle's make and model.");
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!selectedService) {
                toast.error("Please choose a service package to continue.");
                return;
            }
            setStep(3);
        } else if (step === 3) {
            if (!schedule.date) {
                toast.error("Please select a servicing date.");
                return;
            }
            if (schedule.requestedPickupDropoff && (!schedule.pickupAddress || !schedule.dropoffAddress)) {
                toast.error("Please fill in both pickup and drop-off addresses.");
                return;
            }
            setStep(4);
        }
    };

    const prevStep = () => {
        setStep(prev => prev - 1);
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
                            setSchedule(prev => ({ ...prev, pickupAddress: resolvedAddress }));
                            setPickupCoordinates({ lat: latitude, lng: longitude });
                            toast.success("Pickup location pinned successfully!");
                        } else {
                            setSchedule(prev => ({ ...prev, dropoffAddress: resolvedAddress }));
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
            const bikeModelString = `${vehicle.make} ${vehicle.model} (${vehicle.type}, ${vehicle.year || 'N/A'})`;
            
            const requestBody = {
                serviceId: selectedService._id,
                bikeModel: bikeModelString,
                date: schedule.date,
                notes: schedule.notes || 'Doorstep workshop service request.',
                requestedPickupDropoff: schedule.requestedPickupDropoff,
                pickupAddress: schedule.requestedPickupDropoff ? schedule.pickupAddress : '',
                dropoffAddress: schedule.requestedPickupDropoff ? schedule.dropoffAddress : '',
                pickupCoordinates: schedule.requestedPickupDropoff ? pickupCoordinates : undefined,
                dropoffCoordinates: schedule.requestedPickupDropoff ? dropoffCoordinates : undefined
            };

            const response = await apiFetchUser('/bookings', {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "Failed to create booking.");
            }

            toast.success("Service booked! Please complete payment to confirm scheduling.");
            navigate('/user/my-payments');
        } catch (err) {
            toast.error(err.message || "Failed to submit booking.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const vehicleTypes = [
        { name: 'Motorcycle', icon: Bike, desc: 'Clutch, chain drive & gears' },
        { name: 'Scooter', icon: Wrench, desc: 'Automatic CVT & step-through' },
        { name: 'Electric', icon: Zap, desc: 'EV battery pack & hub motor' }
    ];

    return (
        <div className="space-y-8 max-w-5xl mx-auto text-[#111118]">
            {/* Header section with back option */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/08 pb-5">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">
                        Schedule Workshop
                    </h1>
                    <p className="text-sm text-[#4A4A65] mt-1.5 max-w-xl">
                        Select your bike specifications, choose service tier packages, set your time window, and review costs.
                    </p>
                </div>
                <Button 
                    variant="secondary" 
                    onClick={() => navigate('/user/dashboard')} 
                    className="shrink-0 h-11 !px-5 text-sm font-semibold !bg-[#F5F3E7] hover:!bg-black/05 text-[#111118] transition-all duration-200"
                >
                    <ArrowLeft size={14} /> Go Back
                </Button>
            </div>

            {/* PROGRESS STEPS BAR */}
            <div className="w-full bg-[#FDFDF8] border border-black/08 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {[
                        { num: 1, label: 'Vehicle Specs', desc: 'Identify your ride' },
                        { num: 2, label: 'Service Package', desc: 'Select workshop tier' },
                        { num: 3, label: 'Schedule & Valet', desc: 'Configure pickup' },
                        { num: 4, label: 'Invoice Review', desc: 'Review & submit' }
                    ].map((s) => {
                        const isCompleted = step > s.num;
                        const isCurrent = step === s.num;
                        
                        return (
                            <div key={s.num} className="flex-1 flex items-center gap-3 relative">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-200 border 
                                        ${isCompleted 
                                            ? 'bg-[#F5C000] border-[#F5C000] text-[#0D0D14]' 
                                            : isCurrent 
                                                ? 'bg-[#FFFCEE] border-[#F5C000] text-[#B8860B] shadow-[0_0_12px_rgba(245,192,0,0.2)]' 
                                                : 'bg-white border-black/10 text-[#8A8AA8]'
                                        }`}
                                    >
                                        {isCompleted ? <Check size={16} /> : s.num}
                                    </div>
                                    <div className="text-left">
                                        <p className={`text-xs font-bold uppercase tracking-wider
                                            ${isCurrent ? 'text-[#B8860B]' : isCompleted ? 'text-[#111118]' : 'text-[#8A8AA8]'}`}
                                        >
                                            {s.label}
                                        </p>
                                        <p className="text-[10px] text-[#8A8AA8] mt-0.5 leading-none">{s.desc}</p>
                                    </div>
                                </div>
                                {s.num < 4 && (
                                    <div className="hidden lg:block flex-1 h-px ml-6 bg-black/07" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* FORM CONTAINER & LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Steps Controller Column (Left 2 Columns) */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-white border border-black/08 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-sm">
                        
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#F5C000]" />

                        {/* STEP 1: VEHICLE INFORMATION */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-[#111118] uppercase tracking-wider flex items-center gap-2 border-b border-black/07 pb-3">
                                    <Bike size={20} className="text-[#F5C000]" />
                                    STEP 1: Vehicle Specs & Blueprint
                                </h2>
                                
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-[#8A8AA8] uppercase tracking-wider">
                                        Select Vehicle Type*
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {vehicleTypes.map((t) => {
                                            const IconComponent = t.icon;
                                            const isSelected = vehicle.type === t.name;
                                            return (
                                                <div 
                                                    key={t.name}
                                                    onClick={() => setVehicle({ ...vehicle, type: t.name })}
                                                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 text-left relative flex flex-col gap-2
                                                        ${isSelected 
                                                            ? 'bg-[#FFFCEE] border-[#F5C000] shadow-[0_0_12px_rgba(245,192,0,0.08)]' 
                                                            : 'bg-[#FDFDF8] border-black/10 hover:border-black/20'}`}
                                                >
                                                    {isSelected && (
                                                        <span className="absolute top-3 right-3 w-4 h-4 bg-[#F5C000] text-[#0D0D14] rounded-full flex items-center justify-center text-[10px] font-bold">
                                                            ✓
                                                        </span>
                                                    )}
                                                    <IconComponent size={24} className={isSelected ? 'text-[#B8860B]' : 'text-[#8A8AA8]'} />
                                                    <div>
                                                        <h4 className="uppercase tracking-wider text-xs font-bold text-[#111118]">
                                                            {t.name}
                                                        </h4>
                                                        <p className="text-[10px] text-[#4A4A65] mt-1 leading-relaxed">
                                                            {t.desc}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                                    <Input 
                                        id="make" 
                                        name="make" 
                                        label="Brand / Make*" 
                                        value={vehicle.make} 
                                        onChange={handleVehicleChange} 
                                        required 
                                        placeholder="e.g. Royal Enfield"
                                    />
                                    <Input 
                                        id="model" 
                                        name="model" 
                                        label="Model Code / Variant*" 
                                        value={vehicle.model} 
                                        onChange={handleVehicleChange} 
                                        required 
                                        placeholder="e.g. Classic 350"
                                    />
                                    <Input 
                                        id="year" 
                                        name="year" 
                                        type="number"
                                        label="Production Year" 
                                        value={vehicle.year} 
                                        onChange={handleVehicleChange} 
                                        placeholder="e.g. 2022"
                                    />
                                </div>
                            </div>
                        )}

                        {/* STEP 2: CHOOSE SERVICE */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-[#111118] uppercase tracking-wider flex items-center gap-2 border-b border-black/07 pb-3">
                                    <Wrench size={20} className="text-[#F5C000]" />
                                    STEP 2: Select Maintenance Package
                                </h2>

                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                    {services.length === 0 ? (
                                        <p className="text-[#8A8AA8] text-sm text-center py-10">Loading available service tier catalogs...</p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {services.map((service) => {
                                                const isSelected = selectedService?._id === service._id;
                                                return (
                                                    <div 
                                                        key={service._id}
                                                        onClick={() => handleServiceSelect(service)}
                                                        className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 relative group flex flex-col justify-between min-h-[140px]
                                                            ${isSelected 
                                                                ? 'bg-[#FFFCEE] border-[#F5C000] shadow-[0_0_12px_rgba(245,192,0,0.08)]' 
                                                                : 'bg-[#FDFDF8] border-black/10 hover:border-black/20'}`}
                                                    >
                                                        <div>
                                                            <div className="flex justify-between items-start gap-2">
                                                                <h4 className="font-bold text-sm text-[#111118] uppercase tracking-wider leading-tight">
                                                                    {service.name}
                                                                </h4>
                                                                <span className="text-[#B8860B] text-sm font-bold shrink-0">
                                                                    रु{service.price}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-[#4A4A65] mt-2 line-clamp-3 leading-relaxed">
                                                                {service.description}
                                                            </p>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#B8860B] mt-3 flex items-center gap-1.5 self-end">
                                                                <Check size={12} /> Package Selected
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 3: SCHEDULE & VALET */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-[#111118] uppercase tracking-wider flex items-center gap-2 border-b border-black/07 pb-3">
                                    <Calendar size={20} className="text-[#F5C000]" />
                                    STEP 3: Operations & Valet Pickup
                                </h2>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <Input 
                                            id="date" 
                                            name="date" 
                                            label="Select Servicing Date*" 
                                            type="date" 
                                            value={schedule.date} 
                                            onChange={handleScheduleChange} 
                                            required 
                                            min={new Date().toISOString().split("T")[0]} 
                                        />
                                        
                                        {/* Toggle Pickup */}
                                        <div className="flex flex-col gap-2 justify-center">
                                            <span className="text-[#8A8AA8] text-[10px] font-bold uppercase tracking-wider">
                                                Valet Doorstep logistics
                                            </span>
                                            <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                                                <div className="relative">
                                                    <input 
                                                        type="checkbox" 
                                                        name="requestedPickupDropoff"
                                                        checked={schedule.requestedPickupDropoff}
                                                        onChange={handleScheduleChange}
                                                        className="sr-only peer" 
                                                    />
                                                    <div className="w-11 h-6 bg-[#FDFDF8] peer-focus:outline-none rounded-full border border-black/10 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-[#8A8AA8] after:border-[#8A8AA8] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:bg-[#F5C000] peer-checked:after:border-[#F5C000] peer-checked:border-[#F5C000]/50"></div>
                                                </div>
                                                <span className="text-xs font-semibold text-[#4A4A65]">
                                                    Request Pick-up & Drop-off (+ रु350)
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Pickup Fields */}
                                    {schedule.requestedPickupDropoff && (
                                        <div className="p-4 bg-[#FDFDF8] border border-black/08 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
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
                                                            value={schedule.pickupAddress}
                                                            onChange={handleScheduleChange}
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
                                                            value={schedule.dropoffAddress}
                                                            onChange={handleScheduleChange}
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

                                    {/* Diagnostic Notes */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="notes" className="block text-xs font-bold text-[#4A4A65] uppercase tracking-wider">
                                            Workshop Diagnosis Log Notes / Symptoms
                                        </label>
                                        <textarea 
                                            id="notes" 
                                            name="notes" 
                                            rows="3" 
                                            value={schedule.notes} 
                                            onChange={handleScheduleChange} 
                                            className="w-full px-4 py-2.5 bg-[#FDFDF8] border border-black/10 focus:border-[#F5C000] focus:outline-none focus:ring-1 focus:ring-[#F5C000]/30 text-[#111118] text-sm rounded-xl placeholder:text-[#8A8AA8] transition-colors"
                                            placeholder="Explain any issues or sound feedback you want checked..."
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: INVOICE SIGN-OFF */}
                        {step === 4 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-[#111118] uppercase tracking-wider flex items-center gap-2 border-b border-black/07 pb-3">
                                    <FileText size={20} className="text-[#F5C000]" />
                                    STEP 4: Invoice Audit & Review
                                </h2>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#FDFDF8] border border-black/08 rounded-2xl p-5 text-sm">
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-[#8A8AA8] font-bold uppercase tracking-wider border-b border-black/07 pb-1">Vehicle Details</p>
                                            <p className="font-semibold text-[#111118] flex items-center gap-2">
                                                <Bike size={16} className="text-[#B8860B]" />
                                                {vehicle.make} {vehicle.model}
                                            </p>
                                            <p className="text-xs text-[#4A4A65]">{vehicle.type} ({vehicle.year || 'N/A'})</p>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-[10px] text-[#8A8AA8] font-bold uppercase tracking-wider border-b border-black/07 pb-1">Chosen Tier</p>
                                            <p className="font-semibold text-[#111118] flex items-center gap-2">
                                                <Wrench size={16} className="text-[#B8860B]" />
                                                {selectedService?.name}
                                            </p>
                                            <p className="text-xs text-[#4A4A65]">Base Cost: <span className="font-mono font-bold text-[#B8860B]">रु{servicePrice}</span></p>
                                        </div>

                                        <div className="space-y-2 sm:col-span-2 border-t border-black/07 pt-3 mt-1">
                                            <p className="text-[10px] text-[#8A8AA8] font-bold uppercase tracking-wider border-b border-black/07 pb-1">Operations & Logistics</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-2">
                                                <p className="flex items-center gap-2 text-[#4A4A65]">
                                                    <Calendar size={14} className="text-[#B8860B]" />
                                                    Date: <span className="font-semibold text-[#111118]">{schedule.date}</span>
                                                </p>
                                                <p className="flex items-center gap-2 text-[#4A4A65]">
                                                    <Truck size={14} className="text-[#B8860B]" />
                                                    Valet pickup: <span className="font-semibold text-[#111118]">{schedule.requestedPickupDropoff ? 'Requested' : 'Self drop'}</span>
                                                </p>
                                            </div>
                                            {schedule.requestedPickupDropoff && (
                                                <div className="bg-white p-3.5 rounded-xl border border-black/08 mt-3 space-y-1.5 text-xs text-[#4A4A65]">
                                                    <p><span className="font-bold text-[#111118]">Pickup:</span> {schedule.pickupAddress}</p>
                                                    <p><span className="font-bold text-[#111118]">Delivery:</span> {schedule.dropoffAddress}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Guarantee Banner */}
                                    <div className="bg-[#FFFCEE] rounded-2xl border border-[#F5C000]/20 p-5 flex gap-3.5 items-start text-left">
                                        <ShieldCheck size={20} className="text-[#B8860B] shrink-0 mt-0.5" />
                                        <div>
                                            <h5 className="text-xs font-bold text-[#B8860B] uppercase tracking-widest">
                                                MOTOFIX REPAIR WARRANTY
                                            </h5>
                                            <p className="text-[11px] text-[#4A4A65] mt-1 leading-relaxed">
                                                All parts swapped, engine diagnostics logged, and mechanics services rendered qualify for our standard 7-day post-service dynamic precision warranty check.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP CONTROLS FOOTER */}
                        <div className="flex justify-between items-center mt-8 pt-5 border-t border-black/07">
                            {step > 1 ? (
                                <Button 
                                    variant="secondary" 
                                    onClick={prevStep}
                                    className="!py-2.5 !px-5 text-xs font-semibold !bg-[#F5F3E7] hover:!bg-black/05 text-[#111118] transition-all duration-200"
                                    disabled={isSubmitting}
                                >
                                    Previous Stage
                                </Button>
                            ) : (
                                <div />
                            )}

                            {step < 4 ? (
                                <Button 
                                    onClick={nextStep}
                                    className="!py-2.5 !px-5 text-xs font-semibold text-[#0D0D14] bg-gradient-to-r from-[#F5C000] to-[#E6B000]"
                                >
                                    Proceed <ArrowRight size={14} className="ml-1 inline" />
                                </Button>
                            ) : (
                                <Button 
                                    onClick={handleSubmit} 
                                    disabled={isSubmitting}
                                    className="!py-2.5 !px-6 text-xs font-semibold text-[#0D0D14] bg-gradient-to-r from-[#F5C000] to-[#E6B000]"
                                >
                                    {isSubmitting ? 'Confirming...' : 'Confirm Specifications'}
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Billing Summary Panel (Right Column) */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-white border border-black/08 rounded-2xl p-5 relative overflow-hidden shadow-sm">
                        
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#F5C000]" />
                        
                        <h3 className="text-base font-bold text-[#111118] uppercase tracking-wider border-b border-black/07 pb-3 flex items-center gap-2">
                            <Sparkles size={16} className="text-[#F5C000]" />
                            Invoice Summary
                        </h3>

                        <div className="pt-4 space-y-4">
                            <div>
                                <p className="text-[10px] text-[#8A8AA8] uppercase tracking-wider font-bold">Selected Service</p>
                                {selectedService ? (
                                    <div className="mt-1.5 flex items-start gap-2 justify-between">
                                        <span className="font-semibold text-sm text-[#111118] max-w-[70%] leading-tight">
                                            {selectedService.name}
                                        </span>
                                        <span className="text-xs font-bold text-[#4A4A65]">
                                            रु{servicePrice}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-xs text-[#8A8AA8] mt-1.5 italic">No package selected yet</p>
                                )}
                            </div>

                            {/* Valet charges */}
                            {schedule.requestedPickupDropoff && (
                                <div className="border-t border-black/05 pt-3">
                                    <p className="text-[10px] text-[#8A8AA8] uppercase tracking-wider font-bold">Logistics Valet</p>
                                    <div className="mt-1.5 flex justify-between text-xs">
                                        <span className="text-[#4A4A65]">Courier Pickup & Drop</span>
                                        <span className="font-semibold text-[#4A4A65]">रु{pickupDropoffCost}</span>
                                    </div>
                                </div>
                            )}

                            {/* Total bill */}
                            <div className="border-t border-black/07 pt-4 mt-6">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs font-bold text-[#111118] uppercase tracking-wider">Estimated Total</span>
                                    <span className="text-3xl font-black text-[#B8860B] font-mono">
                                        रु{finalAmount}
                                    </span>
                                </div>
                                <p className="text-[9px] text-[#8A8AA8] mt-2.5 leading-relaxed">
                                    *Additional spare items or fluid replenishment diagnosed on-site will be logged onto your final Invoice Sheet.
                                </p>
                            </div>
                        </div>

                        {!selectedService && (
                            <div className="mt-6 p-4 bg-[#FDFDF8] border border-black/08 rounded-xl text-center space-y-2">
                                <HelpCircle size={28} className="mx-auto text-[#8A8AA8] mb-1" />
                                <p className="text-[10px] text-[#4A4A65] leading-relaxed">
                                    Please select a service package in Step 2 to configure full invoice billing.
                                </p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default NewBookingPage;