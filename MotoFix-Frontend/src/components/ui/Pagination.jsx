import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Button from './Button';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="!px-3 !py-1.5 text-sm">
                <ArrowLeft size={16} /> Previous
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300">Page {currentPage} of {totalPages}</span>
            <Button variant="secondary" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="!px-3 !py-1.5 text-sm">
                Next <ArrowRight size={16} />
            </Button>
        </div>
    );
};

export default Pagination;