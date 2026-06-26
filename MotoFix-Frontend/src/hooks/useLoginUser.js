import { loginUserService } from "../services/authServices";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

export const useLoginUser = () => {
    return useMutation({
        mutationFn: loginUserService,
        mutationKey: ["login-key"],
        onSuccess: (res) => {
            console.log("Login response:", res); // 👀 Check this

            // Correct: res.data is the user, res.token is the token
            login(res.data, res.token); // 
            toast.success("Login successful!");
        },

        onError: (error) => {
            toast.error("Login failed. Please try again.");
        }
    });
};
