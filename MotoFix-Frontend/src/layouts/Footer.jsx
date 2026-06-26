import React from 'react';

const FooterLogo = () => (
  <div className="flex items-center gap-2.5">
    <div className="relative w-9 h-9">
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <polygon points="18,2 33,10 33,26 18,34 3,26 3,10" fill="#F5C000" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle"
          fontSize="14" fontWeight="900" fontFamily="Inter,sans-serif" fill="#111118" letterSpacing="-0.5">
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

const SocialLink = ({ href, label, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="w-9 h-9 rounded-xl bg-black/05 border border-black/08 flex items-center justify-center
               text-[#4A4A65] hover:text-[#B8860B] hover:bg-[rgba(245,192,0,0.12)] hover:border-[rgba(245,192,0,0.3)]
               transition-all duration-200"
  >
    {children}
  </a>
);

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#F5F3E7] text-[#4A4A65] border-t border-black/08">
      {/* Yellow top accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#F5C000] to-transparent opacity-70" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand column */}
          <div className="space-y-5">
            <FooterLogo />
            <p className="text-sm text-[#6B6B88] leading-relaxed max-w-xs">
              Your trusted workshop partner for professional two-wheeler servicing with seamless pick-up and drop convenience across the city.
            </p>
            {/* Socials */}
            <div className="flex items-center gap-2.5 pt-1">
              <SocialLink href="https://www.instagram.com/messipaaglu/" label="Instagram">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.2,5.2 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.2,5.2 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" />
                </svg>
              </SocialLink>
              <SocialLink href="https://x.com/seducedop" label="X (Twitter)">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </SocialLink>
              <SocialLink href="https://www.linkedin.com/in/dipendra-ghimire-62b25a345/" label="LinkedIn">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zm-8 12H7V9h4v6zm-2-7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 7h-4v-3a2 2 0 0 0-4 0v3H7V9h4v1.1c.5-.9 1.6-1.6 3.2-1.6 3.5 0 4.8 2.3 4.8 5.3V15z" />
                </svg>
              </SocialLink>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-[#4A4A65]/60 mb-5">
              Navigation
            </h3>
            <ul className="space-y-3.5">
              {[
                { label: 'Our Services', href: '#service' },
                { label: 'About Us',     href: '#why-choose-us' },
                { label: 'Testimonials', href: '#about' },
                { label: 'Contact',      href: '#about' },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-[#6B6B88] hover:text-[#B8860B] transition-colors duration-200
                               flex items-center gap-2 group"
                  >
                    <span className="w-0 h-px bg-[#F5C000] group-hover:w-3 transition-all duration-300 inline-block" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-[#4A4A65]/60 mb-5">
              Contact
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-[#F5C000] mt-0.5 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <span className="text-sm text-[#6B6B88]">Kathmandu, Nepal</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#F5C000] mt-0.5 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </span>
                <span className="text-sm text-[#4A4A65] font-semibold">(+977) 9849423853</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#F5C000] mt-0.5 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <a href="mailto:contact@motofix.com" className="text-sm text-[#6B6B88] hover:text-[#B8860B] transition-colors">
                  contact@motofix.com
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-[#4A4A65]/60 mb-5">
              Newsletter
            </h3>
            <p className="text-sm text-[#6B6B88] leading-relaxed mb-5">
              Get the latest servicing tips and exclusive deals straight to your inbox.
            </p>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full px-4 py-3 text-sm bg-white border border-black/10
                           rounded-xl text-[#111118] placeholder-[#8A8AA8] outline-none
                           focus:border-[rgba(245,192,0,0.5)] focus:shadow-[0_0_0_3px_rgba(245,192,0,0.12)]
                           transition-all duration-200"
              />
              <button
                type="submit"
                className="w-full py-3 text-sm font-semibold text-[#111118] rounded-xl
                           bg-gradient-to-r from-[#F5C000] to-[#E6B000]
                           hover:shadow-[0_4px_20px_rgba(245,192,0,0.4)] hover:-translate-y-0.5
                           transition-all duration-200 shadow-[0_4px_14px_rgba(245,192,0,0.22)]"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-black/08 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#8A8AA8]">
            © {year} MotoFix. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5C000] opacity-80" />
            <p className="text-xs text-[#8A8AA8] font-medium tracking-widest uppercase">
              Engineered for Two-Wheeler Precision
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;