import React from 'react';

const Button = ({ children, onClick, className = '', variant = 'primary', ...props }) => {
    const baseClasses = "px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:active:scale-100 cursor-pointer";
    const variants = {
        primary: "bg-gradient-to-r from-[#F5C000] to-[#E6B000] text-[#0D0D14] shadow-[0_4px_16px_rgba(245,192,0,0.3)] hover:shadow-[0_6px_24px_rgba(245,192,0,0.45)] hover:-translate-y-0.5",
        secondary: "bg-[#F5F3E7] hover:bg-black/05 text-[#111118] border border-black/10 transition-colors",
        danger: "bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_16px_rgba(239,68,68,0.25)] hover:-translate-y-0.5",
        success: "bg-green-600 hover:bg-green-700 text-white shadow-[0_4px_16px_rgba(34,197,94,0.25)] hover:-translate-y-0.5",
        special: "bg-gradient-to-r from-[#F5C000] to-[#B8860B] text-[#0D0D14] hover:shadow-[0_6px_20px_rgba(245,192,0,0.35)] hover:-translate-y-0.5"
    };
    return (<button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>{children}</button>);
};

export default Button;