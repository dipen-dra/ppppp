import React from 'react';

const getStatusStyles = (status) => {
    const s = status ? status.toLowerCase() : '';
    switch (s) {
        case 'completed':
        case 'paid':
        case 'esewa':
            return 'bg-green-100 text-green-700 border-green-200';
        case 'in progress':
            return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'pending':
            return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'cancelled':
            return 'bg-red-100 text-red-700 border-red-200';
        case 'khalti':
            return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'cod':
            return 'bg-stone-100 text-stone-700 border-stone-200';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

const StatusBadge = ({ status }) => {
    const styles = getStatusStyles(status);
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${styles}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {status}
        </span>
    );
};

export default StatusBadge;