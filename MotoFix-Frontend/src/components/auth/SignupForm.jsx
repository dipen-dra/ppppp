import React, { useState, useMemo, useEffect } from 'react';
import { UserIcon, EmailIcon, LockIcon } from '../../assets/icons';
import { FormInputWithLabel } from './FormInputWIthLabel';
import { toast } from 'react-toastify';
import { registerUserApi, getCaptchaApi } from '../../api/authApi';
import TermsModal from '../auth/TermsModals';

// ── Password strength analyser ────────────────────────────────────────────────
const analysePassword = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: '' };

  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++;

  // Normalize to 1–4 tiers
  const tier = score <= 2 ? 1 : score <= 3 ? 2 : score <= 4 ? 3 : 4;

  const map = {
    1: { label: 'Weak',   color: '#ef4444', segments: 1 },
    2: { label: 'Fair',   color: '#f97316', segments: 2 },
    3: { label: 'Good',   color: '#eab308', segments: 3 },
    4: { label: 'Strong', color: '#22c55e', segments: 4 },
  };
  return { score: tier, ...map[tier] };
};

// ── Strength meter bar ────────────────────────────────────────────────────────
const PasswordStrengthMeter = ({ password }) => {
  const { score, label, color, segments } = useMemo(() => analysePassword(password), [password]);

  if (!password) return null;

  return (
    <div className="mt-1.5 space-y-1.5">
      {/* 4-segment bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i <= segments ? color : '#E5E7EB',
              opacity: i <= segments ? 1 : 0.4
            }}
          />
        ))}
      </div>
      {/* Label + requirements */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color }}>{label}</span>
        {score < 4 && (
          <span className="text-[11px]" style={{ color: '#6B7280' }}>
            {score === 1 && 'Add uppercase, numbers & symbols'}
            {score === 2 && 'Add more variety'}
            {score === 3 && 'Add 12+ chars or symbol'}
          </span>
        )}
      </div>
      {/* Requirements checklist */}
      <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-0.5">
        {[
          { test: password.length >= 8,               label: '8+ characters' },
          { test: /[A-Z]/.test(password),              label: 'Uppercase letter' },
          { test: /[a-z]/.test(password),              label: 'Lowercase letter' },
          { test: /[0-9]/.test(password),              label: 'Number' },
          { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), label: 'Special character' },
        ].map(({ test, label }) => (
          <li key={label} className="flex items-center gap-1 text-[11px]" style={{ color: test ? '#22c55e' : '#9CA3AF' }}>
            {test
              ? <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              : <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            }
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const SignupForm = ({ onSwitch }) => {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [captchaText, setCaptchaText] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const fetchCaptcha = async () => {
    try {
      const data = await getCaptchaApi();
      if (data.success) {
        setCaptchaSvg(data.captchaSvg);
        setCaptchaToken(data.captchaToken);
        setCaptchaText('');
      }
    } catch (err) {
      toast.error('Failed to load CAPTCHA code.');
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const validateStrongPassword = (pwd) => {
    if (pwd.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(pwd)) return "Password must contain at least one number.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Password must contain at least one special character.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields.');
      return;
    }
    if (!captchaText) {
      toast.error('Please complete the CAPTCHA.');
      return;
    }
    const pwdErr = validateStrongPassword(formData.password);
    if (pwdErr) {
      toast.error(pwdErr);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (!agreed) {
      toast.error('You must agree to the terms and conditions.');
      return;
    }
    setLoading(true);
    try {
      await registerUserApi({
        ...formData,
        captchaText,
        captchaToken
      });
      toast.success('Account created! A verification email will be sent. Please sign in.');
      setFormData({ fullName: '', email: '', password: '', confirmPassword: '' });
      setCaptchaText('');
      setAgreed(false);
      setTimeout(() => onSwitch(), 1500);
    } catch (err) {
      toast.error(err.message || 'Sign up failed');
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const strengthOK = analysePassword(formData.password).score >= 4;
  const passwordsMatch = formData.password && (formData.password === formData.confirmPassword);

  return (
    <>
      <div className="mb-7">
        <h1 className="text-2xl font-black text-[#111118] tracking-tight">
          Create Account 🚀
        </h1>
        <p className="text-sm mt-1.5" style={{ color: '#4A4A65' }}>
          Join MotoFix and get your first service scheduled today.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormInputWithLabel
          id="fullName"
          label="Full Name"
          type="text"
          placeholder="John Doe"
          icon={<UserIcon />}
          value={formData.fullName}
          onChange={handleChange}
        />
        <FormInputWithLabel
          id="email"
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          icon={<EmailIcon />}
          value={formData.email}
          onChange={handleChange}
        />

        {/* Password with strength meter */}
        <div>
          <FormInputWithLabel
            id="password"
            label="Password"
            type="password"
            placeholder="Create a strong password"
            icon={<LockIcon />}
            value={formData.password}
            onChange={handleChange}
          />
          <PasswordStrengthMeter password={formData.password} />
        </div>

        <FormInputWithLabel
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          icon={<LockIcon />}
          value={formData.confirmPassword}
          onChange={handleChange}
        />

        {/* CAPTCHA Validation */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#111118]">Verify Security Code</label>
          <div className="flex items-center gap-3">
            {captchaSvg ? (
              <div 
                dangerouslySetInnerHTML={{ __html: captchaSvg }} 
                className="flex-shrink-0 border border-gray-200 rounded-lg overflow-hidden h-12 flex items-center justify-center bg-gray-50"
                style={{ width: '140px' }}
              />
            ) : (
              <div className="w-[140px] h-12 bg-gray-100 rounded-lg animate-pulse" />
            )}
            <button
              type="button"
              onClick={fetchCaptcha}
              className="p-3 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all text-[#4A4A65] rounded-xl flex items-center justify-center"
              title="Refresh CAPTCHA"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
            <input
              type="text"
              id="captchaText"
              placeholder="Enter code"
              value={captchaText}
              onChange={(e) => setCaptchaText(e.target.value.toUpperCase())}
              maxLength={5}
              required
              className="flex-grow h-12 px-4 rounded-xl border border-[rgba(0,0,0,0.15)] bg-white text-sm text-[#0D0D14]
                         focus:border-[#F5C000] focus:ring-1 focus:ring-[#F5C000] focus:outline-none transition-all duration-200"
            />
          </div>
        </div>

        {/* Terms checkbox */}
        <div className="flex items-start gap-3 mt-1">
          <div className="relative mt-0.5 flex-shrink-0">
            <input
              type="checkbox"
              id="terms"
              checked={agreed}
              onChange={() => setAgreed(!agreed)}
              className="sr-only"
            />
            <div
              onClick={() => setAgreed(!agreed)}
              className={`w-4.5 h-4.5 rounded cursor-pointer border-2 flex items-center justify-center transition-all duration-200 ${
                agreed
                  ? 'bg-[#F5C000] border-[#F5C000]'
                  : 'border-[rgba(0,0,0,0.2)] bg-white hover:border-[#F5C000]'
              }`}
              style={{ width: '18px', height: '18px' }}
            >
              {agreed && (
                <svg className="w-2.5 h-2.5" fill="none" stroke="#0D0D14" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <label className="text-sm leading-snug cursor-pointer select-none" style={{ color: '#4A4A65' }}
                 onClick={() => setAgreed(!agreed)}>
            I agree to the{' '}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowTermsModal(true); }}
              className="font-semibold bg-transparent border-none p-0 cursor-pointer transition-colors duration-150"
              style={{ color: '#B8860B' }}
              onMouseEnter={e => e.currentTarget.style.color = '#E6B000'}
              onMouseLeave={e => e.currentTarget.style.color = '#B8860B'}
            >
              Terms and Conditions
            </button>
          </label>
        </div>

        <button
          type="submit"
          disabled={!agreed || loading || !strengthOK || !passwordsMatch}
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
              Creating Account...
            </>
          ) : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: '#4A4A65' }}>
        Already have an account?{' '}
        <button
          onClick={onSwitch}
          className="font-semibold bg-transparent border-none p-0 cursor-pointer transition-colors"
          style={{ color: '#B8860B' }}
          onMouseEnter={e => e.currentTarget.style.color = '#E6B000'}
          onMouseLeave={e => e.currentTarget.style.color = '#B8860B'}
        >
          Sign In
        </button>
      </p>

      {showTermsModal && <TermsModal onClose={() => setShowTermsModal(false)} />}
    </>
  );
};
