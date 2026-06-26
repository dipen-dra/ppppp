const TermsModal = ({ onClose }) => {
    const terms = [
        { title: "Service Authorization", content: "By signing up, you authorize MotoFix to perform the requested services on your two-wheeler." },
        { title: "Payment", content: "Full payment is due upon completion of services. Your vehicle will be released only after full payment." },
        { title: "Parts", content: "We use both OEM and high-quality aftermarket parts. All parts remain the property of MotoFix until paid in full." },
        { title: "Liability", content: "MotoFix is not responsible for personal items left in the vehicle or pre-existing damage." },
        { title: "Vehicle Storage", content: "A storage fee may be applied if your vehicle is not collected within 48 hours of service completion." },
        { title: "Warranty", content: "We offer a 30-day or 1000 km warranty on specific repairs performed." },
        { title: "Data Privacy", content: "Your personal information is collected for service and communication purposes only." }
    ];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50 p-4 transition-opacity duration-300 animate-fade-in">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-[#F5C000]/10 blur-[80px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-[#F5C000]/5 blur-[80px] pointer-events-none" />

            <div className="bg-[#FDFDF8] border border-[rgba(0,0,0,0.08)] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden transform transition-all duration-300 scale-95 animate-modal-pop">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[rgba(0,0,0,0.06)] bg-white">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8">
                                <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                    <polygon points="18,2 33,10 33,26 18,34 3,26 3,10" fill="#F5C000" stroke="#0D0D14" strokeWidth="1.5" />
                                    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="900" fontFamily="Inter,sans-serif" fill="#0D0D14">M</text>
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-[#111118] tracking-tight">MotoFix - Terms & Conditions</h2>
                                <p className="text-xs text-[#8A8AA8] font-medium">Please review our authorization policies before proceeding</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="text-[#8A8AA8] hover:text-[#111118] rounded-full p-2 hover:bg-[#F5F3E7] transition-all duration-200 cursor-pointer" 
                            aria-label="Close"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-4 bg-[#FDFDF8] custom-scrollbar">
                    {terms.map((term, index) => (
                        <div 
                            key={index} 
                            className="flex items-start gap-4 p-4 rounded-xl border border-[rgba(0,0,0,0.04)] bg-white hover:border-[rgba(245,192,0,0.2)] hover:shadow-[0_4px_16px_rgba(245,192,0,0.04)] hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[rgba(245,192,0,0.12)] border border-[rgba(245,192,0,0.2)] flex items-center justify-center text-sm font-black text-[#B8860B]">
                                {index + 1}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-black text-[#111118] tracking-tight">{term.title}</h3>
                                <p className="text-sm text-[#4A4A65] leading-relaxed font-medium">{term.content}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-[#F5F3E7]/40 border-t border-[rgba(0,0,0,0.06)] flex items-center justify-between">
                    <p className="text-xs text-[#8A8AA8] font-semibold">By clicking "I Understand", you agree to our policies.</p>
                    <button 
                        onClick={onClose} 
                        className="bg-gradient-to-r from-[#F5C000] to-[#E6B000] text-[#0D0D14] font-bold rounded-xl px-6 py-3 text-sm hover:shadow-[0_4px_16px_rgba(245,192,0,0.35)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsModal;