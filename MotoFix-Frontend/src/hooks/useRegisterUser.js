import { useState } from "react";
import { registerUserService } from "../services/authServices";
import { toast } from "react-toastify";

export const useRegisterUser = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const register = async (formData) => {
        //when user clicks on register button, this function will be called
        //it will send the formData to the server and get the response
        setLoading(true);
        setError(null);
        setData(null);//clear state
        try {
            const response = await registerUserService(formData);
            setData(response);
            toast.success("Registration successful!");
            return response; // Return the response for further use if needed
        } catch (err) {
            const errorMessage = err.message || "Registration Failed";
            setError(errorMessage);
            toast.error(errorMessage);
            return null; // Return null or handle the error as needed
        } finally {
            setLoading(false);
        }
    };
    return {
        register,
        loading,
        error,
        data
    };
}