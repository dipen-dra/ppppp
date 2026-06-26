// import { registerUserApi } from "../api/authApi";
// import { loginUserApi } from "../api/authApi";

// export const registerUserService = async (formData) => {
//     try {
//         const response = await registerUserApi(formData);
//         return response.data;
//     } catch (error) {
//         throw error.response?.data || { message: "Registration failed" };
//     }
// }

// export const loginUserService = async (formData) => {
//     try {
//         const response = await loginUserApi(formData);
//         console.log("API response:", response.data);
//         return response.data;
//     } catch (error) {
//         throw error.response?.data || { message: "Login failed" };
//     }
// };

import api from "../api/api";

// The paths are updated to include "/auth" so they correctly resolve against the new base URL.
export const loginUser = async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
};

export const registerUser = async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
};

export const forgotPassword = async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

export const resetPassword = async (token, password) => {
    const response = await api.post(`/auth/reset-password/${token}`, { password });
    return response.data;
};
