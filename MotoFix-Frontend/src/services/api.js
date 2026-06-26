import { toast } from 'react-toastify';

const API_BASE_URL_USER = "http://localhost:5050/api/user";

// This function now ALWAYS returns the raw Response object on success.
export const apiFetchUser = async (endpoint, options = {}) => {
    const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        ...options.headers
    };

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL_USER}${endpoint}`, { ...options, headers });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'An API error occurred.');
    }

    return response; // ALWAYS return the response object
};