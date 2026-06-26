import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const services = [
  { title: 'General Service',      description: 'From oil changes to brake inspections, our general service covers every essential aspect to keep your bike in optimal condition.', imageUrl: 'https://pplx-res.cloudinary.com/image/upload/v1749554608/gpt4o_images/iqiqmts2nwcfackizvjy.png' },
  { title: 'Engine Repair',        description: 'Facing unusual noise or performance drops? Our engine experts diagnose and fix problems efficiently using high-quality parts.', imageUrl: 'https://pplx-res.cloudinary.com/image/upload/v1749554990/gpt4o_images/iwycnvpey4wfffv7q0dt.png' },
  { title: 'Denting & Painting',   description: 'Give your bike a makeover! We remove dents and provide precision paintwork to restore that brand-new shine.', imageUrl: 'https://pplx-res.cloudinary.com/image/upload/v1749555492/gpt4o_images/am0n8x501uzraegjm0ly.png' },
  { title: 'Insurance Claims',     description: 'We simplify the insurance process — paperwork, damage evaluation, and claim processing, quick and worry-free.', imageUrl: 'https://pplx-res.cloudinary.com/image/upload/v1749555695/gpt4o_images/bdogajkde4cpf1bde5fc.png' },
  { title: 'Tire Care',            description: 'Professional tire inspection, puncture repair, and replacement services to ensure your safety and a smooth ride.', imageUrl: 'https://pplx-res.cloudinary.com/image/upload/v1749870126/gpt4o_images/rdzir9c1zjxzacax23a3.png' },
  { title: 'Brake System',         description: "Complete inspection and servicing of your bike's brake system, including fluid change and pad replacement.", imageUrl: 'https://pplx-res.cloudinary.com/image/upload/v1749742141/gpt4o_images/qyploqur4ivlgfzjlx5u.png' },
  { title: 'Suspension Tuning',    description: 'Optimize ride comfort and handling with expert suspension tuning, tailored to your riding style.', imageUrl: 'https://pplx-res.cloudinary.com/image/upload/v1749870248/gpt4o_images/tc4cstuz8iefxbn4mhlh.png' },
  { title: 'Full Body Detailing',  description: "A comprehensive cleaning and polishing service that restores your bike's showroom shine.", imageUrl: 'https://pplx-res.cloudinary.com/image/upload/v1749478483/gpt4o_images/oziuai3wafnxufaqcfei.png' },
];

// Static marquee services fallback
const marqueeServicesStatic = [...services, ...services];

const stats = [
  { value: '4.9/5', label: 'Rider Rating' },
  { value: '12K+',  label: 'Bikes Serviced' },
  { value: '45min', label: 'Avg. Pickup' },
  { value: '100%',  label: 'Transparent Pricing' },
];

const whyUs = [
  {
    title: 'Master Mechanics',
    desc: 'Certified mechanics bring precision instruments and diagnostic tools straight to your location.',
    imageUrl: 'https://pplx-res.cloudinary.com/image/upload/v1749555876/gpt4o_images/bybdnjs6xsay9lvrwxd1.png',
    icon: '🔧',
  },
  {
    title: 'Fixed Estimates',
    desc: 'Zero-surprises guarantee. Review and approve digital invoice breakdowns before we touch a single wrench.',
    imageUrl: 'https://www.pmrgo.com/wp-content/uploads/2025/05/transparent-pricing-packers-and-movers.webp',
    icon: '📋',
  },
  {
    title: 'Doorstep Pickup',
    desc: 'Full pickup and drop tracking. We safely tow, restore, and return your machine on schedule.',
    imageUrl: 'https://pplx-res.cloudinary.com/image/upload/v1749741326/gpt4o_images/nxpnscz8nwbgx1o3aqkg.png',
    icon: '🚚',
  },
];

const steps = [
  { step: '01', title: 'Book a Slot',   desc: 'Choose your service, schedule a pickup time, and confirm your details in minutes.' },
  { step: '02', title: 'We Pickup',     desc: 'Our driver arrives at your location with full tracking visibility on your end.' },
  { step: '03', title: 'We Fix It',     desc: 'Expert technicians service your bike in our bay with a strict quality checklist.' },
  { step: '04', title: 'We Deliver',    desc: 'Your bike is returned fully cleaned, tested, and ready to ride.' },
];

const testimonials = [
  { name: 'Aman Chaudhary', bike: 'KTM Duke 390', quote: 'The best service I\'ve ever had. Pickup was timely and the technician explained every step. Highly recommended!', initial: 'A' },
  { name: 'Prajwol Neupane', bike: 'Pulsar NS200', quote: 'MotoFix fixed a complicated engine issue without me visiting a workshop. Diagnosis to delivery was flawless!', initial: 'P' },
  { name: 'Sydney Sweeney', bike: 'Vespa VXL150', quote: 'They handled everything smoothly and the repair was perfect. My bike looks brand new. Amazing quality and speed!', initial: 'S' },
];

const StarRow = () => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(i => (
      <svg key={i} className="w-3.5 h-3.5 text-[#F5C000] fill-current" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

export const HomePage = () => {
  const [backendServices, setBackendServices] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('http://localhost:5050/api/public/services');
        const data = await response.json();
        if (data.success && data.data) {
          setBackendServices(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch public services:", error);
      }
    };
    fetchServices();
  }, []);

  const displayServices = backendServices.length > 0 ? backendServices : services;
  const marqueeServices = [...displayServices, ...displayServices];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        id="home"
        className="relative min-h-[calc(100vh-72px)] flex items-center overflow-hidden bg-[#FDFDF8]"
      >
        {/* Subtle pattern */}
        <div className="absolute inset-0 pattern-bg opacity-60 pointer-events-none" />

        {/* Yellow orb top-right */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] orb orb-yellow opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] orb orb-yellow opacity-30 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 py-16 lg:py-24 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center animate-fade-in">
          {/* Left Column: Text Content */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2.5 mb-6 animate-fade-in-down">
              <span className="section-label">
                Nepal's #1 Doorstep Service
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-7xl xl:text-8xl font-black tracking-tight text-[#111118] leading-[1.05] mb-6 animate-fade-in-up">
              Your Bike,<br />
              <span className="relative inline-block">
                <span className="gradient-text">Fixed Fast.</span>
                <svg className="absolute -bottom-3 left-0 w-full" viewBox="0 0 400 12" fill="none">
                  <path d="M2 10 Q200 2 398 10" stroke="#F5C000" strokeWidth="3" strokeLinecap="round" fill="none"/>
                </svg>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-[#4A4A65] max-w-xl leading-relaxed mb-8 animate-fade-in" style={{ animationDelay: '0.15s' }}>
              MotoFix delivers dealership-grade mechanics to your doorstep. Transparent quotes, real-time tracking, zero hassle.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: '0.25s' }}>
              <Link
                to="/login"
                className="btn btn-primary text-base px-8 py-4"
                style={{ borderRadius: '14px' }}
              >
                Book a Service
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href="#service"
                className="btn btn-secondary text-base px-8 py-4"
                style={{ borderRadius: '14px' }}
              >
                Explore Services
              </a>
            </div>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-3 mt-10 animate-fade-in" style={{ animationDelay: '0.35s' }}>
              {['✓ Free Pickup & Drop', '✓ Certified Mechanics', '✓ Fixed Pricing'].map((t) => (
                <span key={t} className="text-xs font-semibold text-[#4A4A65] bg-black/05 border border-black/08 px-3 py-1.5 rounded-pill">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right Column: Hero Image Asset */}
          <div className="lg:col-span-5 relative flex justify-center items-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {/* Soft gold glowing ambient backdrop orb */}
            <div className="absolute w-72 h-72 bg-[#F5C000]/10 blur-[80px] rounded-full -z-10 animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="relative p-2 bg-[#F5F3E7]/40 border border-black/05 rounded-[32px] shadow-[0_24px_64px_rgba(0,0,0,0.06)] hover:shadow-[0_32px_80px_rgba(245,192,0,0.15)] transition-all duration-500 hover:scale-[1.01] group">
              <img
                src="http://localhost:5050/uploads/hero_motorcycle.png"
                alt="MotoFix Premium Motorcycle Service"
                className="w-full h-auto max-w-md lg:max-w-none rounded-[24px] object-cover aspect-[4/3] sm:aspect-square lg:aspect-auto shadow-sm"
              />
              {/* Subtle brand highlights */}
              <div className="absolute top-4 left-4 section-label !py-1 !px-2.5 !text-[9px] !gap-1.5 shadow-sm bg-white/95 backdrop-blur border-none text-[#111118] font-bold">
                Premium Towing Included
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ──────────────────────────────────── */}
      <section className="bg-[#F5F3E7] py-10 border-y border-black/06">
        <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label} className="group">
              <p className="text-4xl md:text-5xl font-black text-[#F5C000] tracking-tight drop-shadow-sm">
                {s.value}
              </p>
              <p className="text-xs font-semibold text-[#6B6B88] uppercase tracking-widest mt-2">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why Choose Us ────────────────────────────────── */}
      <section id="why-choose-us" className="py-24 bg-[#FDFDF8]">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-4">
              <span className="section-label">Why MotoFix?</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-[#111118] tracking-tight">
              Professional Care,<br/>
              <span className="gradient-text">At Your Doorstep</span>
            </h2>
            <p className="text-[#4A4A65] mt-4 max-w-xl mx-auto">
              Experience garage-grade service without leaving your driveway.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {whyUs.map((item, idx) => (
              <div
                key={idx}
                className="group relative rounded-2xl overflow-hidden cursor-pointer"
                style={{ height: '340px' }}
              >
                {/* Background image */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#111118] via-[rgba(17,17,24,0.6)] to-transparent" />
                {/* Yellow hover border */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[rgba(245,192,0,0.5)] rounded-2xl transition-all duration-300" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-7">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F5C000] flex items-center justify-center text-lg">
                      {item.icon}
                    </div>
                    <div className="h-0.5 flex-1 bg-[#F5C000] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed max-h-0 overflow-hidden group-hover:max-h-20 transition-all duration-300">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────── */}
      <section className="py-24 bg-[#F5F3E7]">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-4">
              <span className="section-label">Simple Process</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-[#111118] tracking-tight">
              How It <span className="gradient-text">Works</span>
            </h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Connecting line */}
            <div className="absolute top-12 left-[12.5%] right-[12.5%] h-px hidden md:block"
                 style={{ background: 'repeating-linear-gradient(90deg, #F5C000, #F5C000 6px, transparent 6px, transparent 14px)', opacity: 0.5 }} />

            {steps.map((item, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
                {/* Number circle */}
                <div className="w-24 h-24 rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]
                                border-2 border-[#EDE9D5] group-hover:border-[#F5C000]
                                flex items-center justify-center mb-5 transition-all duration-300
                                group-hover:shadow-[0_8px_30px_rgba(245,192,0,0.25)]">
                  <span className="text-3xl font-black text-[#F5C000]">{item.step}</span>
                </div>
                <h4 className="text-base font-bold text-[#111118] mb-2">{item.title}</h4>
                <p className="text-sm text-[#4A4A65] leading-relaxed max-w-[200px]">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Link to="/login" className="btn btn-primary text-base px-10 py-4" style={{ borderRadius: '14px' }}>
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      {/* ── Services Marquee ─────────────────────────────── */}
      <section id="service" className="py-24 bg-[#FDFDF8] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-8 mb-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="mb-4">
                <span className="section-label">What We Do</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-[#111118] tracking-tight">
                Our <span className="gradient-text">Services</span>
              </h2>
            </div>
            <p className="text-[#4A4A65] max-w-xs text-sm leading-relaxed">
              Hover any card to learn more. We cover everything your bike needs.
            </p>
          </div>
        </div>

        <div className="marquee-container relative overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#FDFDF8] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#FDFDF8] to-transparent z-10 pointer-events-none" />

          <div className="marquee py-4 gap-5">
            {marqueeServices.map((service, idx) => (
              <div key={idx} className="flex-shrink-0 w-72 mx-3">
                <div
                  className="relative rounded-2xl overflow-hidden group cursor-pointer"
                  style={{ height: '280px' }}
                >
                  <img
                    src={service.image ? `http://localhost:5050/${service.image}` : service.imageUrl}
                    alt={service.name || service.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x400/f5f3e7/111118?text=${encodeURIComponent(service.name || service.title)}`; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111118] via-[rgba(17,17,24,0.5)] to-transparent" />
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-[rgba(245,192,0,0.4)] rounded-2xl transition-all duration-300" />

                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="h-0.5 w-8 bg-[#F5C000] mb-3 group-hover:w-16 transition-all duration-300 rounded-full" />
                    <h3 className="text-lg font-bold text-white mb-1">{service.name || service.title}</h3>
                    <p className="text-xs text-white/60 leading-relaxed opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-20 transition-all duration-300">
                      {service.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      <section id="about" className="py-24 bg-[#F5F3E7]">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-4">
              <span className="section-label">Reviews</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-[#111118] tracking-tight">
              What Riders <span className="gradient-text">Say</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="bg-white border border-black/08 rounded-2xl p-7
                           hover:border-[rgba(245,192,0,0.4)] hover:shadow-[0_8px_32px_rgba(245,192,0,0.12)]
                           transition-all duration-300 hover:-translate-y-1"
              >
                {/* Stars */}
                <StarRow />

                {/* Quote */}
                <p className="text-sm text-[#4A4A65] leading-relaxed mt-5 italic">
                  "{t.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3.5 mt-7 pt-5 border-t border-black/07">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5C000] to-[#E6B000]
                                  flex items-center justify-center font-black text-[#111118] text-base flex-shrink-0">
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111118]">{t.name}</p>
                    <p className="text-xs text-[#8A8AA8] mt-0.5">{t.bike}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────── */}
      <section className="bg-[#FDFDF8] py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-br from-[#F5C000] to-[#E6B000] rounded-3xl p-12
                          shadow-[0_8px_48px_rgba(245,192,0,0.35)]">
            <h2 className="text-4xl md:text-5xl font-black text-[#111118] tracking-tight mb-4">
              Ready to Ride Again?
            </h2>
            <p className="text-[#111118]/60 text-lg mb-8 max-w-md mx-auto">
              Book your service in under 2 minutes. Our team will do the rest.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2.5 bg-white text-[#111118] font-bold text-base
                         px-10 py-4 rounded-xl hover:bg-[#FDFDF8] transition-all duration-200
                         shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]
                         hover:-translate-y-0.5"
            >
              Book Now — It's Free
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;