import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const EsewaSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Verifying your payment, please wait...');
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      const params = new URLSearchParams(location.search);
      const data = params.get('data');

      if (data) {
        try {
          const response = await fetch(`http://localhost:5050/api/payment/esewa/verify?data=${data}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || result.message || 'An unknown verification error occurred.');
          }

          setMessage(result.message);
          setIsVerifying(false);
          toast.success('Payment successful!');
          setTimeout(() => {
            navigate('/dashboard#/user/my-payments');
          }, 3000);
        } catch (error) {
          setMessage(error.message);
          setIsVerifying(false);
          toast.error(error.message);
          setTimeout(() => {
            navigate('/dashboard#/user/my-payments');
          }, 3000);
        }
      } else {
        setMessage('No payment data received from eSewa.');
        setIsVerifying(false);
        toast.error('Could not verify payment.');
        setTimeout(() => {
          navigate('/dashboard#/user/my-payments');
        }, 3000);
      }
    };

    verifyPayment();
  }, [location, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFDF8] pattern-bg relative overflow-hidden px-4 text-center">
      {/* Decorative Orbs */}
      <div className="fixed top-0 right-0 w-96 h-96 orb orb-yellow opacity-40 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-72 h-72 orb orb-yellow opacity-25 pointer-events-none" />

      <div className="relative z-10 max-w-md w-full p-8 bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_4px_32px_rgba(0,0,0,0.08)] animate-fade-in-up">
        {isVerifying ? (
          <div className="flex flex-col items-center py-6">
            <div className="w-12 h-12 border-4 border-[rgba(245,192,0,0.2)] border-t-[#F5C000] rounded-full animate-spin mb-6" />
            <h1 className="text-xl font-black text-[#111118] tracking-tight">{message}</h1>
            <p className="text-sm text-[#4A4A65] mt-2">Connecting with eSewa servers...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6 space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(22,163,74,0.1)] border border-[rgba(22,163,74,0.2)]
                            flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="#16A34A" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#111118] tracking-tight">Payment Verified!</h1>
              <p className="text-sm text-[#4A4A65] mt-2 leading-relaxed">{message}</p>
            </div>
            <p className="text-xs text-[#8A8AA8]">You will be automatically redirected to your payments dashboard shortly.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EsewaSuccess;
