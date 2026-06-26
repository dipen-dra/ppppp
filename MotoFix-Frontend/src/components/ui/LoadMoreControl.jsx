import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Button from './Button';

const LoadMoreControl = ({ onToggle, isExpanded, hasMore }) => {
    if (!hasMore) return null;

    return (
        <div className="flex justify-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
                variant="secondary"
                onClick={onToggle}
                className="!px-6 !py-2 text-sm !gap-1.5 transform hover:scale-105 hover:shadow-lg transition-all duration-200"
            >
                {isExpanded ? (
                    <>
                        <ChevronUp size={18} /> Show Less
                    </>
                ) : (
                    <>
                        <ChevronDown size={18} /> Load More
                    </>
                )}
            </Button>
        </div>
    );
};

export default LoadMoreControl;