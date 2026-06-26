import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { Edit, Camera, MapPin, User, Phone, Mail } from 'lucide-react';
import { apiFetchUser } from '../../../services/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

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
            } catch (error) {
                toast.error(error.message || "Failed to fetch profile.");
            }
        };
        fetchProfile();
    }, []);

    const handleFetchLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            return;
        }
        setIsFetchingLocation(true);
        toast.info("Accessing GPS satellites...");
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    if (!response.ok) throw new Error('Failed to convert location to address.');
                    const data = await response.json();
                    if (data && data.display_name) {
                        setProfile(p => ({ ...p, address: data.display_name }));
                        toast.success("Coordinates resolved successfully!");
                    } else {
                        throw new Error('Could not find address from coordinates.');
                    }
                } catch (error) {
                    toast.error(error.message);
                } finally {
                    setIsFetchingLocation(false);
                }
            },
            (error) => {
                toast.error("Geolocation permission denied. Please check your system settings.");
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
        if (profile.newProfilePicture) {
            formData.append('profilePicture', profile.newProfilePicture);
        }
        try {
            const response = await apiFetchUser('/profile', {
                method: 'PUT',
                body: formData
            });
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || "Failed to update profile.");
            }
            
            const updatedData = { ...data.data, address: data.data.address || '' };
            setProfile(updatedData);
            setInitialProfile(updatedData);
            setCurrentUser(updatedData); // Update parent state
            setIsEditing(false);
            toast.success(data.message || 'Profile spec updated successfully!');
        } catch (error) {
            toast.error(error.message || 'Failed to update profile.');
        }
    };

    const handleCancel = () => {
        setProfile(initialProfile);
        setIsEditing(false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfile(p => ({ ...p, profilePictureUrl: URL.createObjectURL(file), newProfilePicture: file }));
        }
    };

    const handleImageError = (e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName || 'U')}&background=F5F3E7&color=111118&size=128`; };
    const profilePictureSrc = profile.profilePictureUrl || (profile.profilePicture ? `http://localhost:5050/${profile.profilePicture}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName || 'U')}&background=F5F3E7&color=111118&size=128`);

    return (
        <div className="space-y-8 max-w-5xl mx-auto text-[#111118]">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/08 pb-5">
                <div>
                    <h1 className="text-3xl font-black tracking-tight leading-none">
                        Rider Profile
                    </h1>
                    <p className="text-sm text-[#4A4A65] mt-1.5 max-w-xl">
                        View and update your personal details, secure contact coordinates, and primary pick-up address.
                    </p>
                </div>
                {!isEditing && (
                    <Button 
                        onClick={() => setIsEditing(true)} 
                        className="shrink-0 h-11 !px-5 text-sm font-semibold text-[#0D0D14] bg-gradient-to-r from-[#F5C000] to-[#E6B000] shadow-[0_4px_16px_rgba(245,192,0,0.3)] hover:shadow-[0_6px_24px_rgba(245,192,0,0.45)] hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <Edit size={14} /> Edit Profile Details
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Card: Avatar Card */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-0 overflow-hidden relative border border-black/08 bg-white rounded-2xl shadow-sm">
                        {/* Upper Accent Banner */}
                        <div className="h-28 bg-[#FDFDF8] relative flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(45deg,#F5C000_25%,transparent_25%,transparent_50%,#F5C000_50%,#F5C000_75%,transparent_75%,transparent)] bg-[length:40px_40px]"></div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-[#F5C000]"></div>
                        </div>

                        {/* Profile Info Content */}
                        <div className="px-6 pb-8 pt-0 flex flex-col items-center -mt-14 relative z-10 text-center">
                            <div className="relative group">
                                <img 
                                    key={profilePictureSrc} 
                                    src={profilePictureSrc} 
                                    alt="Profile avatar" 
                                    className="w-28 h-28 rounded-full object-cover ring-4 ring-[#F5C000]/30 shadow-md bg-white" 
                                    onError={handleImageError} 
                                />
                                {isEditing && (
                                    <div 
                                        onClick={() => fileInputRef.current.click()}
                                        className="absolute inset-0 bg-black/60 hover:bg-black/75 rounded-full flex flex-col items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-200 border-2 border-[#F5C000]"
                                    >
                                        <Camera size={18} className="mb-1 text-[#F5C000] animate-pulse" />
                                        <span className="text-[9px] font-bold uppercase tracking-wider">Change Photo</span>
                                    </div>
                                )}
                            </div>
                            
                            {isEditing && (
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                    accept="image/*" 
                                />
                            )}

                            <h2 className="text-lg font-black mt-4 text-[#111118] tracking-tight">
                                {profile.fullName || 'Rider Profile'}
                            </h2>
                            <p className="text-[10px] text-[#B8860B] font-bold tracking-widest uppercase mt-1">
                                MEMBER CREW
                            </p>
                            
                            <div className="w-full border-t border-black/07 mt-6 pt-5 flex justify-center">
                                <div className="text-center">
                                    <p className="text-[10px] text-[#8A8AA8] font-bold uppercase tracking-widest">Verification Status</p>
                                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 mt-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-green-500/10 text-green-600 border border-green-500/20">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Active Rider
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Card: Fields Details Grid */}
                <div className="lg:col-span-2">
                    <Card className="bg-white border border-black/08 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#F5C000]" />

                        <h3 className="text-base font-bold text-[#111118] uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-black/07 pb-3">
                            <User size={18} className="text-[#F5C000]" />
                            Rider Specifications
                        </h3>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <Input 
                                    id="fullName" 
                                    label="Full Identity Name" 
                                    name="fullName" 
                                    value={profile.fullName || ''} 
                                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} 
                                    disabled={!isEditing} 
                                    placeholder="Enter your full name"
                                    className="focus:ring-[#F5C000] focus:border-[#F5C000]"
                                />
                                <Input 
                                    id="email" 
                                    label="Contact Email Address" 
                                    name="email" 
                                    type="email" 
                                    value={profile.email || ''} 
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })} 
                                    disabled={!isEditing} 
                                    placeholder="yourname@example.com"
                                    className="focus:ring-[#F5C000] focus:border-[#F5C000]"
                                />
                            </div>

                            <Input 
                                id="phone" 
                                label="Mobile Phone Coordinates" 
                                name="phone" 
                                value={profile.phone || ''} 
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })} 
                                disabled={!isEditing} 
                                placeholder="+977 98XXXXXXXX"
                                className="focus:ring-[#F5C000] focus:border-[#F5C000]"
                            />

                            <div className="space-y-1.5">
                                <label htmlFor="address" className="block text-xs font-bold text-[#4A4A65] uppercase tracking-wider">
                                    Primary Workshop Pickup Address
                                </label>
                                <div className="flex gap-2">
                                    <textarea 
                                        id="address" 
                                        name="address" 
                                        rows="3"
                                        className="w-full px-4 py-2.5 bg-[#FDFDF8] border border-black/10 focus:border-[#F5C000] focus:outline-none focus:ring-1 focus:ring-[#F5C000]/30 text-[#111118] text-sm rounded-xl placeholder:text-[#8A8AA8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        value={profile.address || ''}
                                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                        disabled={!isEditing || isFetchingLocation}
                                        placeholder="Fetch coordinates via Satellite GPS or enter address manually..."
                                    />
                                    {isEditing && (
                                        <button 
                                            type="button" 
                                            onClick={handleFetchLocation} 
                                            disabled={isFetchingLocation} 
                                            className="shrink-0 rounded-xl border border-black/10 hover:border-[#F5C000] bg-[#FDFDF8] hover:bg-[#F5F3E7] text-[#4A4A65] hover:text-[#B8860B] transition-colors w-12 h-12 flex items-center justify-center self-end disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                            title="Auto-detect Dynamic Address Coordinates"
                                        >
                                            <MapPin size={18} className={isFetchingLocation ? 'animate-bounce text-[#B8860B]' : ''} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {isEditing && (
                                <div className="flex items-center justify-end gap-3 pt-6 border-t border-black/07 mt-8">
                                    <Button 
                                        variant="secondary" 
                                        onClick={handleCancel} 
                                        className="!px-6 !py-2.5 text-xs font-semibold !bg-[#F5F3E7] hover:!bg-black/05 text-[#111118] transition-all duration-200"
                                    >
                                        Cancel Changes
                                    </Button>
                                    <Button 
                                        onClick={handleSave} 
                                        className="!px-6 !py-2.5 text-xs font-semibold text-[#0D0D14] bg-gradient-to-r from-[#F5C000] to-[#E6B000]"
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;