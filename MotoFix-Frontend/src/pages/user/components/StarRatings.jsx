import React, { useState } from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ rating = 0, onRatingChange, readOnly = false, size = 20 }) => {
    const [hoverRating, setHoverRating] = useState(0);

    const handleMouseOver = (index) => {
        if (readOnly) return;
        setHoverRating(index);
    };

    const handleMouseLeave = () => {
        if (readOnly) return;
        setHoverRating(0);
    };

    const handleClick = (index) => {
        if (readOnly || !onRatingChange) return;
        onRatingChange(index);
    };

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((index) => (
                <Star
                    key={index}
                    size={size}
                    className={`transition-colors duration-200 ${!readOnly ? 'cursor-pointer' : ''} ${
                        (hoverRating || rating) >= index
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                    }`}
                    onMouseOver={() => handleMouseOver(index)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleClick(index)}
                />
            ))}
        </div>
    );
};

export default StarRating;
