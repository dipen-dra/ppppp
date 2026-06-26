// api.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050/api/auth";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

// Request interceptor to attach the token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor to handle expired tokens
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            const isAuthRoute = window.location.pathname === '/login' || 
                                window.location.pathname === '/register' || 
                                (error.config && error.config.url && (
                                    error.config.url.includes('/login') || 
                                    error.config.url.includes('/register') ||
                                    error.config.url.includes('/captcha') ||
                                    error.config.url.includes('/verify-otp')
                                ));
            if (!isAuthRoute) {
                // Token is invalid or expired
                localStorage.clear(); 
                // Redirect to the login page
                window.location.href = '/login'; 
            }
        }
        return Promise.reject(error);
    }
);

export default api;