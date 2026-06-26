import React, { useContext, useState } from 'react';
import { EmailIcon, LockIcon } from '../../assets/icons';
import { FormInputWithLabel } from './FormInputWIthLabel';
import { toast } from 'react-toastify';
import { loginUserApi, verifyOTPApi, verifyTOTPLoginApi } from '../../api/authApi';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContext';

// ── OTP digit input component ──────────────────────────────────────────────────
const OTPInput = ({ value, onChange }) => {
  const digits = (value + '      ').slice(0, 6).split('');

  const handleKey = (e, idx) => {
    const key = e.key;
    if (key === 'Backspace') {
      const arr = value.split('');
      arr[idx] = '';
      onChange(arr.join('').replace(/\s/g, ''));
      // Focus previous
      if (idx > 0) e.target.previousElementSibling?.focus();
      return;
    }
    if (/^\d$/.test(key)) {
      const arr = value.padEnd(6, ' ').split('');
      arr[idx] = key;
      onChange(arr.join('').replace(/\s/g, ''));
      // Focus next
      if (idx < 5) e.target.nextElementSibling?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {[0, 1, 2, 3, 4, 5].map(i => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i]?.trim() || ''}
          onChange={() => {}}
          onKeyDown={e => handleKey(e, i)}
          className="w-11 h-13 text-center text-xl font-black rounded-xl border-2 bg-[#F5F3E7]
                     border-[rgba(0,0,0,0.15)] focus:border-[#F5C000] focus:outline-none
                     focus:bg-white transition-all duration-150 text-[#111118]"
          style={{ height: '52px' }}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
};

export const LoginForm = ({ onSwitch }) => {
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  // OTP flow state
  const [stage, setStage] = useState('password'); // 'password' | 'otp' | 'totp'
  const [tempToken, setTempToken] = useState('');
  const [otp, setOtp] = useState('');
  const [totpCode, setTotpCode] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // ── Stage 1: Password submit ─────────────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await loginUserApi(formData);
      const data = res.data;

      if (data.requiresOTP) {
        setTempToken(data.tempToken);
        setStage('otp');
        toast.info('A verification code has been sent to your email.', { autoClose: 4000 });
      } else if (data.requiresTOTP) {
        setTempToken(data.tempToken);
        setStage('totp');
        toast.info('Enter your 2FA authenticator code.', { autoClose: 4000 });
      } else {
        // Fallback: direct login (if OTP disabled for some reason)
        login(data.data, data.token);
        toast.success('Login successful!');
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Stage 2a: Email OTP submit ────────────────────────────────────────────────
  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error('Please enter the complete 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOTPApi({ tempToken, otp });
      const data = res.data;
      login(data.data, data.token);
      toast.success('Login successful!');
    } catch (err) {
      toast.error(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Stage 2b: TOTP submit ─────────────────────────────────────────────────────
  const handleTOTPSubmit = async (e) => {
    e.preventDefault();
    if (!totpCode || totpCode.length < 6) {
      toast.error('Please enter your 6-digit authenticator code.');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyTOTPLoginApi({ tempToken, token: totpCode });
      const data = res.data;
      login(data.data, data.token);
      toast.success('Login successful!');
    } catch (err) {
      toast.error(err.message || 'Invalid authenticator code.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render: OTP verification screen ─────────────────────────────────────────
  if (stage === 'otp') {
    return (
      <>
        <div className="mb-7 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F5C000]/15 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#B8860B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-[#111118] tracking-tight">Check Your Email</h1>
          <p className="text-sm mt-1.5" style={{ color: '#4A4A65' }}>
            We sent a 6-digit code to <strong>{formData.email}</strong>.<br/>
            Enter it below to complete sign in.
          </p>
        </div>

        <form onSubmit={handleOTPSubmit} className="flex flex-col gap-6">
          <OTPInput value={otp} onChange={setOtp} />

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full h-12 rounded-xl font-semibold text-sm text-[#0D0D14]
                       bg-gradient-to-r from-[#F5C000] to-[#E6B000]
                       shadow-[0_4px_16px_rgba(245,192,0,0.35)]
                       hover:shadow-[0_6px_24px_rgba(245,192,0,0.5)]
                       hover:-translate-y-0.5 active:scale-[0.98]
                       transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                       cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#0D0D14]/20 border-t-[#0D0D14] rounded-full animate-spin" />
                Verifying...
              </>
            ) : 'Verify Code'}
          </button>

          <button
            type="button"
            onClick={() => { setStage('password'); setOtp(''); }}
            className="text-sm font-semibold text-center w-full bg-transparent border-none cursor-pointer"
            style={{ color: '#4A4A65' }}
          >
            ← Back to Sign In
          </button>
        </form>
      </>
    );
  }

  // ── Render: TOTP screen ──────────────────────────────────────────────────────
  if (stage === 'totp') {
    return (
      <>
        <div className="mb-7 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F5C000]/15 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#B8860B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-[#111118] tracking-tight">Authenticator Code</h1>
          <p className="text-sm mt-1.5" style={{ color: '#4A4A65' }}>
            Open your authenticator app and enter the 6-digit code.
          </p>
        </div>

        <form onSubmit={handleTOTPSubmit} className="flex flex-col gap-5">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={totpCode}
            onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full h-14 text-center text-2xl font-black rounded-xl border-2 bg-[#F5F3E7]
                       border-[rgba(0,0,0,0.15)] focus:border-[#F5C000] focus:outline-none
                       focus:bg-white transition-all duration-150 tracking-widest text-[#111118]"
            autoFocus
          />

          <button
            type="submit"
            disabled={loading || totpCode.length < 6}
            className="w-full h-12 rounded-xl font-semibold text-sm text-[#0D0D14]
                       bg-gradient-to-r from-[#F5C000] to-[#E6B000]
                       shadow-[0_4px_16px_rgba(245,192,0,0.35)]
                       hover:shadow-[0_6px_24px_rgba(245,192,0,0.5)]
                       hover:-translate-y-0.5 active:scale-[0.98]
                       transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                       cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#0D0D14]/20 border-t-[#0D0D14] rounded-full animate-spin" />
                Verifying...
              </>
            ) : 'Verify'}
          </button>

          <button
            type="button"
            onClick={() => { setStage('password'); setTotpCode(''); }}
            className="text-sm font-semibold text-center w-full bg-transparent border-none cursor-pointer"
            style={{ color: '#4A4A65' }}
          >
            ← Back to Sign In
          </button>
        </form>
      </>
    );
  }

  // ── Render: Password stage ───────────────────────────────────────────────────
  return (
    <>
      <div className="mb-7">
        <h1 className="text-2xl font-black text-[#111118] tracking-tight">
          Welcome back 👋
        </h1>
        <p className="text-sm mt-1.5" style={{ color: '#4A4A65' }}>
          Sign in to manage your bookings and service history.
        </p>
      </div>

      <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
        <FormInputWithLabel
          id="email"
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          icon={<EmailIcon />}
          value={formData.email}
          onChange={handleChange}
        />
        <FormInputWithLabel
          id="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          icon={<LockIcon />}
          value={formData.password}
          onChange={handleChange}
        />

        <div className="flex justify-end -mt-1">
          <Link
            to="/forgot-password"
            className="text-xs font-semibold transition-colors duration-150"
            style={{ color: '#B8860B' }}
            onMouseEnter={e => e.currentTarget.style.color = '#E6B000'}
            onMouseLeave={e => e.currentTarget.style.color = '#B8860B'}
          >
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-3 w-full h-12 rounded-xl font-semibold text-sm text-[#0D0D14]
                     bg-gradient-to-r from-[#F5C000] to-[#E6B000]
                     shadow-[0_4px_16px_rgba(245,192,0,0.35)]
                     hover:shadow-[0_6px_24px_rgba(245,192,0,0.5)]
                     hover:-translate-y-0.5 active:scale-[0.98]
                     transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                     cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-[#0D0D14]/20 border-t-[#0D0D14] rounded-full animate-spin" />
              Signing In...
            </>
          ) : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: '#4A4A65' }}>
        Don't have an account?{' '}
        <button
          onClick={onSwitch}
          className="font-semibold bg-transparent border-none p-0 cursor-pointer transition-colors duration-150"
          style={{ color: '#B8860B' }}
          onMouseEnter={e => e.currentTarget.style.color = '#E6B000'}
          onMouseLeave={e => e.currentTarget.style.color = '#B8860B'}
        >
          Create Account
        </button>
      </p>
    </>
  );
};