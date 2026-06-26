import React from 'react';

const Card = ({ children, className = '', ...props }) => (
    <div 
        {...props} 
        className={`bg-white border border-black/08 rounded-2xl p-6 transition-all duration-200 shadow-sm ${className}`}
    >
        {children}
    </div>
);

export default Card;