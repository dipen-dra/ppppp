import React from 'react';
import { Link } from 'react-router-dom';

const EsewaFailure = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFDF8] pattern-bg relative overflow-hidden px-4 text-center">
      {/* Decorative Orbs */}
      <div className="fixed top-0 right-0 w-96 h-96 orb orb-yellow opacity-40 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-72 h-72 orb orb-yellow opacity-25 pointer-events-none" />

      <div className="relative z-10 max-w-md w-full p-8 bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_4px_32px_rgba(0,0,0,0.08)] animate-fade-in-up">
        <div className="flex flex-col items-center py-4 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)]
                          flex items-center justify-center">
            <svg className="w-8 h-8 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <div>
            <h1 className="text-2xl font-black text-[#111118] tracking-tight">Payment Failed</h1>
            <p className="text-sm text-[#4A4A65] mt-2 leading-relaxed">
              Your payment could not be processed. If any money was deducted, it will be refunded or credited shortly. Please try booking/paying again.
            </p>
          </div>

          <Link
            to="/dashboard#/user/my-payments"
            className="inline-flex items-center justify-center w-full h-12 text-sm font-semibold text-[#0D0D14]
                       bg-gradient-to-r from-[#F5C000] to-[#E6B000] rounded-xl
                       shadow-[0_4px_16px_rgba(245,192,0,0.35)]
                       hover:shadow-[0_6px_24px_rgba(245,192,0,0.5)] hover:-translate-y-0.5
                       transition-all duration-200"
          >
            Go back to My Payments
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EsewaFailure;