import React, { useState, useEffect } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';

export default function App() {
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    const handleHashChange = () => {
      setIsLogin(window.location.hash !== '#/signup');
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFDF8] pattern-bg relative overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      
      {/* Decorative Blur Background Orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-[#F5C000]/10 to-[#E6B000]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-tr from-[#B8860B]/10 to-[#F5C000]/5 blur-3xl pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <polygon points="18,2 33,10 33,26 18,34 3,26 3,10" fill="#F5C000" stroke="#0D0D14" strokeWidth="1.5" />
              <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="900" fontFamily="Inter,sans-serif" fill="#0D0D14">M</text>
            </svg>
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-[#111118]">Moto</span>
            <span className="text-2xl font-black tracking-tight text-[#F5C000]">Fix</span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="w-full flex bg-[#F5F3E7] border border-[rgba(0,0,0,0.07)] p-1 rounded-xl mb-6 gap-1">
          <button
            onClick={() => { window.location.hash = '#/login'; }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              isLogin
                ? 'bg-white text-[#111118] shadow-[0_1px_6px_rgba(0,0,0,0.1)]'
                : 'text-[#4A4A65] hover:text-[#111118]'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { window.location.hash = '#/signup'; }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              !isLogin
                ? 'bg-white text-[#111118] shadow-[0_1px_6px_rgba(0,0,0,0.1)]'
                : 'text-[#4A4A65] hover:text-[#111118]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Container */}
        <div className="w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-6 sm:p-8">
          {isLogin
            ? <LoginForm onSwitch={() => { window.location.hash = '#/signup'; }} />
            : <SignupForm onSwitch={() => { window.location.hash = '#/login'; }} />
          }
        </div>
      </div>
    </div>
  );
}

export { App as AuthPage };
