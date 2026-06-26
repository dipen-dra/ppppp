import axios from "axios";

// This instance points to the root of your backend server.
const reviewApi = axios.create({
    baseURL: "http://localhost:5050", // Note: NO /api or /api/auth here
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

// We still need to add the authentication token to requests for this API.
reviewApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

/**
 * Submits a review for a specific booking.
 * This function uses the full path to the review endpoint.
 * @param {string} bookingId - The ID of the booking being reviewed.
 * @param {object} reviewData - An object containing { rating, comment }.
 */
export const submitReview = (bookingId, reviewData) => {
    // We use the full path from the server root: /api/reviews/:bookingId
    return reviewApi.post(`/api/reviews/${bookingId}`, reviewData);
};