import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    // State for toggling password visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        const validateStrongPassword = (pwd) => {
            if (pwd.length < 8) return "Password must be at least 8 characters long.";
            if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter.";
            if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter.";
            if (!/[0-9]/.test(pwd)) return "Password must contain at least one number.";
            if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Password must contain at least one special character.";
            return null;
        };

        const pwdErr = validateStrongPassword(password);
        if (pwdErr) {
            setError(pwdErr);
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(`/api/auth/reset-password/${token}`, { password });
            setSuccessMessage(response.data.message + " Redirecting you to login page...");
            setTimeout(() => {
                navigate('/auth');
            }, 3500);
        } catch (err) {
            const errorMessage = err.response?.data?.message || "An unexpected error occurred. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#FDFDF8] pattern-bg relative overflow-hidden"
            style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease' }}
        >
            {/* Orbs */}
            <div className="fixed top-0 right-0 w-96 h-96 orb orb-yellow opacity-40 pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-72 h-72 orb orb-yellow opacity-25 pointer-events-none" />

            <div className="relative z-10 w-full max-w-md animate-fade-in-up">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-10 h-10">
                            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                <polygon points="18,2 33,10 33,26 18,34 3,26 3,10" fill="#F5C000" stroke="#0D0D14" strokeWidth="1.5" />
                                <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="900" fontFamily="Inter,sans-serif" fill="#0D0D14">M</text>
                            </svg>
                        </div>
                        <div>
                            <span className="text-2xl font-black text-[#111118]">Moto</span>
                            <span className="text-2xl font-black text-[#F5C000]">Fix</span>
                        </div>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_4px_32px_rgba(0,0,0,0.08)] p-8">
                    {successMessage ? (
                        /* ── Success State ── */
                        <div className="text-center space-y-5 py-4">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-[rgba(22,163,74,0.1)] border border-[rgba(22,163,74,0.2)]
                                            flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" stroke="#16A34A" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-[#111118] mb-2">Password Reset!</h2>
                                <p className="text-sm text-[#4A4A65] leading-relaxed">
                                    {successMessage}
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* ── Form State ── */
                        <>
                            <div className="mb-7">
                                <div className="w-12 h-12 rounded-xl bg-[rgba(245,192,0,0.12)] border border-[rgba(245,192,0,0.2)]
                                                flex items-center justify-center mb-5">
                                    <svg className="w-6 h-6 text-[#F5C000]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-black text-[#111118] tracking-tight">Set a New Password</h2>
                                <p className="text-sm mt-1.5 text-[#4A4A65]">
                                    Please enter your new password below.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* New Password Input */}
                                <div>
                                    <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-widest text-[#4A4A65] mb-1.5">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full bg-[#FDFDF8] border border-[rgba(0,0,0,0.1)]
                                                       focus:border-[#F5C000] focus:shadow-[0_0_0_3px_rgba(245,192,0,0.12)]
                                                       outline-none text-[#111118] text-sm rounded-xl py-3 pl-4 pr-10
                                                       placeholder:text-[#8A8AA8] transition-all duration-200
                                                       hover:border-[rgba(0,0,0,0.18)]"
                                            placeholder="Enter your new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8A8AA8] hover:text-[#111118]"
                                        >
                                            {showPassword ? (
                                                <EyeSlashIcon className="h-5 w-5" />
                                            ) : (
                                                <EyeIcon className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password Input */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-widest text-[#4A4A65] mb-1.5">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="block w-full bg-[#FDFDF8] border border-[rgba(0,0,0,0.1)]
                                                       focus:border-[#F5C000] focus:shadow-[0_0_0_3px_rgba(245,192,0,0.12)]
                                                       outline-none text-[#111118] text-sm rounded-xl py-3 pl-4 pr-10
                                                       placeholder:text-[#8A8AA8] transition-all duration-200
                                                       hover:border-[rgba(0,0,0,0.18)]"
                                            placeholder="Confirm your new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8A8AA8] hover:text-[#111118]"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeSlashIcon className="h-5 w-5" />
                                            ) : (
                                                <EyeIcon className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-xs text-[#DC2626] flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {error}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 rounded-xl font-semibold text-sm text-[#0D0D14]
                                               bg-gradient-to-r from-[#F5C000] to-[#E6B000]
                                               shadow-[0_4px_16px_rgba(245,192,0,0.35)]
                                               hover:shadow-[0_6px_24px_rgba(245,192,0,0.5)] hover:-translate-y-0.5
                                               active:scale-[0.98] transition-all duration-200
                                               disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                                               cursor-pointer flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-[#0D0D14]/20 border-t-[#0D0D14] rounded-full animate-spin" />
                                            Resetting...
                                        </>
                                    ) : 'Reset Password'}
                                </button>
                            </form>
                        </>
                    )}
                </div>

                <p className="text-center mt-6 text-xs text-[#4A4A65]">
                    © {new Date().getFullYear()} MotoFix. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
