import React from 'react';

const Input = React.forwardRef(({ id, label, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">
        {label && (
            <label 
                htmlFor={id} 
                className="text-xs font-semibold uppercase tracking-widest text-[#4A4A65]"
            >
                {label}
            </label>
        )}
        <input 
            id={id} 
            {...props} 
            ref={ref} 
            className={`block w-full bg-[#FDFDF8] border border-[rgba(0,0,0,0.1)]
                       focus:border-[#F5C000] focus:shadow-[0_0_0_3px_rgba(245,192,0,0.12)]
                       outline-none text-[#111118] text-sm rounded-xl px-4 py-3
                       placeholder:text-[#8A8AA8] transition-all duration-200
                       hover:border-[rgba(0,0,0,0.18)] disabled:opacity-50 disabled:cursor-not-allowed ${className}`} 
        />
    </div>
));

export default Input;