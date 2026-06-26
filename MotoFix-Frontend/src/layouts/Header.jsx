import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const MotoFixLogo = () => (
  <div className="flex items-center gap-2.5">
    {/* Hexagonal icon */}
    <div className="relative w-9 h-9">
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <polygon
          points="18,2 33,10 33,26 18,34 3,26 3,10"
          fill="#F5C000"
          stroke="#0D0D14"
          strokeWidth="1.5"
        />
        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle"
          fontSize="14" fontWeight="900" fontFamily="Inter,sans-serif" fill="#0D0D14" letterSpacing="-0.5">
          M
        </text>
      </svg>
    </div>
    <div>
      <span className="text-xl font-black tracking-tight text-[#111118]">Moto</span>
      <span className="text-xl font-black tracking-tight text-[#F5C000]">Fix</span>
    </div>
  </div>
);

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isLoginPage   = location.pathname === '/login';
  const isSignupView  = location.pathname === '/login' && location.hash === '#/signup';

  // Sticky scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setIsMenuOpen(false), [location]);

  // Smooth scroll helper
  const handleNavigation = (sectionId) => {
    const targetPath = sectionId ? `/#${sectionId}` : '/';
    if (location.pathname !== '/' || location.hash !== `#${sectionId}`) {
      navigate(targetPath);
    }
    setTimeout(() => {
      if (sectionId) {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  useEffect(() => {
    const sectionId = location.hash ? location.hash.replace('#', '') : 'home';
    if (location.pathname === '/') {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else if (!location.hash) window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  const handleLoginClick = () => {
    if (!isLoginPage || isSignupView) {
      navigate('/login#/login');
      window.location.reload();
    }
  };
  const handleSignupClick = () => {
    if (!isLoginPage || !isSignupView) {
      navigate('/login#/signup');
      window.location.reload();
    }
  };

  const navLinks = [
    { label: 'Home',     id: 'home' },
    { label: 'Services', id: 'service' },
    { label: 'About',    id: 'why-choose-us' },
    { label: 'Contact',  id: 'about' },
  ];

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-lg shadow-[0_2px_20px_rgba(0,0,0,0.08)] border-b border-black/08'
          : 'bg-white/80 backdrop-blur-md border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18" style={{ height: '72px' }}>
          
          {/* Logo */}
          <div
            className="flex-shrink-0 cursor-pointer select-none"
            onClick={() => handleNavigation('home')}
          >
            <MotoFixLogo />
          </div>

          {/* Center nav — Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavigation(link.id)}
                className="relative px-4 py-2 text-sm font-500 text-[#4A4A65] hover:text-[#111118] rounded-lg
                           hover:bg-black/05 transition-all duration-200 group font-[500]"
              >
                {link.label}
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#F5C000]
                                 rounded-full group-hover:w-4 transition-all duration-300" />
              </button>
            ))}
          </div>

          {/* Right — Auth Buttons Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={handleLoginClick}
              disabled={isLoginPage && !isSignupView}
              className="px-5 py-2.5 text-sm font-semibold text-[#111118] border border-black/12
                         rounded-xl hover:border-black/25 hover:bg-black/04 transition-all duration-200
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sign In
            </button>
            <button
              onClick={handleSignupClick}
              disabled={isSignupView}
              className="px-5 py-2.5 text-sm font-semibold text-[#0D0D14] rounded-xl
                         bg-gradient-to-br from-[#F5C000] to-[#E6B000]
                         shadow-[0_4px_16px_rgba(245,192,0,0.35)]
                         hover:shadow-[0_6px_24px_rgba(245,192,0,0.5)] hover:-translate-y-0.5
                         transition-all duration-200
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
            >
              Register
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2.5 rounded-xl border border-black/10 bg-white hover:bg-black/05
                       text-[#111118] transition-all duration-200 focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              {isMenuOpen
                ? <path d="M6 18L18 6M6 6l12 12" />
                : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden border-t border-black/07
                    ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="bg-white px-4 pt-3 pb-5 space-y-1">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => { handleNavigation(link.id); setIsMenuOpen(false); }}
              className="block w-full text-left px-4 py-3 text-sm font-medium text-[#4A4A65]
                         hover:text-[#111118] hover:bg-[#F5F3E7] rounded-xl transition-all duration-200"
            >
              {link.label}
            </button>
          ))}

          <div className="pt-3 border-t border-black/07 grid grid-cols-2 gap-2.5 mt-2">
            <button
              onClick={handleLoginClick}
              disabled={isLoginPage && !isSignupView}
              className="py-3 text-sm font-semibold text-[#111118] border border-black/12
                         rounded-xl hover:bg-black/05 transition-all disabled:opacity-40"
            >
              Sign In
            </button>
            <button
              onClick={handleSignupClick}
              disabled={isSignupView}
              className="py-3 text-sm font-semibold text-[#0D0D14]
                         bg-gradient-to-br from-[#F5C000] to-[#E6B000]
                         rounded-xl shadow-[0_4px_12px_rgba(245,192,0,0.3)]
                         hover:shadow-[0_4px_20px_rgba(245,192,0,0.45)]
                         transition-all disabled:opacity-40"
            >
              Register
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
