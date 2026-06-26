import React from 'react';
import { Link } from 'react-router-dom';
import Lottie from 'lottie-react';
import notFoundAnimation from '../animations/404.json';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFDF8] pattern-bg relative overflow-hidden px-4 text-center">
      {/* Decorative Orbs */}
      <div className="fixed top-0 right-0 w-96 h-96 orb orb-yellow opacity-40 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-72 h-72 orb orb-yellow opacity-25 pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full p-6 sm:p-8 bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_4px_32px_rgba(0,0,0,0.08)] animate-fade-in-up">
        {/* Lottie Animation */}
        <div className="max-w-[320px] mx-auto opacity-95">
          <Lottie 
            animationData={notFoundAnimation} 
            loop={true}
            autoplay={true}
          />
        </div>

        {/* Content */}
        <div className="mt-6">
            <h1 className="text-3xl font-black text-[#111118] tracking-tight">
              Oops! Page Not Found
            </h1>
            <p className="text-sm mt-3 mb-8 text-[#4A4A65] max-w-sm mx-auto leading-relaxed">
              It seems the page you're looking for has taken a wrong turn, got lost in the garage, or doesn't exist.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-[#0D0D14]
                         bg-gradient-to-r from-[#F5C000] to-[#E6B000] rounded-xl
                         shadow-[0_4px_16px_rgba(245,192,0,0.35)]
                         hover:shadow-[0_6px_24px_rgba(245,192,0,0.5)] hover:-translate-y-0.5
                         transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Go Back to Home
            </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
