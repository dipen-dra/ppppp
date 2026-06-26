import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from '../../assets/icons';

const FormInputWithLabel = ({ id, label, type, placeholder, icon, value, onChange }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: '#4A4A65' }}
      >
        {label}
      </label>
      <div className="relative">
        {/* Left icon */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5"
             style={{ color: '#8A8AA8' }}>
          {icon}
        </div>

        <input
          id={id}
          name={id}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          autoComplete={isPassword ? 'current-password' : 'email'}
          required
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="block w-full bg-[#FDFDF8] border border-[rgba(0,0,0,0.1)]
                     focus:border-[#F5C000] focus:shadow-[0_0_0_3px_rgba(245,192,0,0.12)]
                     outline-none text-[#111118] text-sm rounded-xl
                     py-3 pl-11 pr-10
                     placeholder:text-[#8A8AA8]
                     transition-all duration-200
                     hover:border-[rgba(0,0,0,0.18)]"
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5
                       transition-colors duration-200 cursor-pointer"
            style={{ color: '#8A8AA8' }}
            onMouseEnter={e => e.currentTarget.style.color = '#F5C000'}
            onMouseLeave={e => e.currentTarget.style.color = '#8A8AA8'}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </div>
  );
};

export { FormInputWithLabel };