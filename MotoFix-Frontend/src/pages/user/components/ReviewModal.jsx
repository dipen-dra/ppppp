import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { X, ThumbsUp } from 'lucide-react';
import StarRating from './StarRating'; // We will create this component next

const API_BASE_URL_REVIEWS = "http://localhost:5050/api/reviews";

const apiSubmitReview = async (bookingId, reviewData) => {
    const response = await fetch(`${API_BASE_URL_REVIEWS}/${bookingId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(reviewData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit review.');
    }
    return response.json();
};


const ReviewModal = ({ isOpen, onClose, booking, onReviewSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !booking) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error("Please select a star rating.");
            return;
        }
        if (comment.trim() === '') {
            toast.error("Please leave a comment.");
            return;
        }
        setIsSubmitting(true);
        try {
            await apiSubmitReview(booking._id, { rating, comment });
            toast.success("Thank you for your review!");
            onReviewSubmitted(); // This will trigger a refresh on the bookings page
            onClose(); // Close the modal
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg relative animate-fade-in-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Leave a Review</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">How was your experience with the "{booking.serviceType}" service?</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col items-center">
                        <label className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Your Rating</label>
                        <StarRating rating={rating} onRatingChange={setRating} size={36} />
                    </div>
                    <div>
                        <label htmlFor="comment" className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Your Comments</label>
                        <textarea
                            id="comment"
                            rows="5"
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                            placeholder="Tell us about your experience..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        ></textarea>
                    </div>
                    <div className="flex justify-end">
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Review'}
                            <ThumbsUp size={20} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
