import axios from "./api";
import axiosBase from "axios";

// Separate instance for /api/user/* routes (security, 2FA, export)
const userApi = axiosBase.create({
    baseURL: import.meta.env.VITE_API_USER_URL || "http://localhost:5050/api/user",
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
});
userApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const getCaptchaApi = async () => {
    try {
        const response = await axios.get("/captcha");
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch CAPTCHA.');
    }
};

export const registerUserApi = async (data) => {
    try {
        const response = await axios.post("/register", data);
        return response;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message || 'Registration failed.');
    }
};

export const loginUserApi = async (formData) => {
    try {
        const response = await axios.post("/login", formData);
        return response;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message || 'Login failed.');
    }
};

export const verifyOTPApi = async ({ tempToken, otp }) => {
    try {
        const response = await axios.post("/verify-otp", { tempToken, otp });
        return response;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message || 'OTP verification failed.');
    }
};

export const verifyTOTPLoginApi = async ({ tempToken, token }) => {
    try {
        // TOTP login challenge is under /api/user
        const response = await userApi.post("/2fa/login", { tempToken, token });
        return response;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message || 'Authenticator verification failed.');
    }
};

export const setup2FAApi = async () => {
    try {
        const response = await userApi.post("/2fa/setup");
        return response;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message || '2FA setup failed.');
    }
};

export const verify2FASetupApi = async ({ token }) => {
    try {
        const response = await userApi.post("/2fa/verify", { token });
        return response;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message || '2FA verification failed.');
    }
};

export const disable2FAApi = async ({ token }) => {
    try {
        const response = await userApi.post("/2fa/disable", { token });
        return response;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message || '2FA disable failed.');
    }
};

export const exportUserDataApi = async () => {
    try {
        const response = await userApi.get("/export-data");
        return response;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message || 'Data export failed.');
    }
};