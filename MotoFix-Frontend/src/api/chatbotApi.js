import axios from "axios";

// This new Axios instance is specifically for the chatbot.
// Its baseURL points to the root of your API, which is what the chatbot routes need.
const API_URL = "http://localhost:5050/api";

const chatbotApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

// It also uses the same logic to add the authentication token if the user is logged in.
chatbotApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default chatbotApi;
