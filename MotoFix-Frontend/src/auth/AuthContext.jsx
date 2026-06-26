// import { createContext, useState, useEffect } from "react";

// export const AuthContext = createContext()

// const AuthContextProvider = ({ children }) => {
//     const [user, setUser] = useState(null)
//     const [loading, setLoading] = useState(true)

//     const login = (userData, token) => {
//         setLoading(true)
//         localStorage.setItem("user", JSON.stringify(userData))
//         localStorage.setItem("token", token)
//         setUser(userData)
//         setLoading(false)
//     }
//     const logout = () => {
//         setLoading(true)
//         localStorage.removeItem("user")
//         localStorage.removeItem("token")
//         setUser(null)
//         setLoading(false)
//     }
//     useEffect(() => {
//         setLoading(true)
//         const token = localStorage.getItem("token")
//         const storedUser = localStorage.getItem("user")
//         console.log(token, storedUser)
//         if (token && storedUser) {
//             setUser(JSON.parse(storedUser))
//         } else {
//             logout()
//         }
//         setLoading(false)
//     }, [])
//     return (
//         <AuthContext.Provider
//             value={{user, loading, login, logout, isAuthenticated: user !== null}}
//         >
//             {children}
//         </AuthContext.Provider>
//     )
// }
// export default AuthContextProvider






import { createContext, useState, useEffect, useMemo } from "react";

export const AuthContext = createContext();

const AuthContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const login = (userData, token) => {
        setLoading(true);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", token);
        setUser(userData);
        setLoading(false);
    };

    const logout = () => {
        setLoading(true);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
        setLoading(false);
    };

    useEffect(() => {
        setLoading(true);
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        console.log(token, storedUser);
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            // No need to call logout(), just set the user to null
            setUser(null);
        }
        setLoading(false);
    }, []);

    // --- The Change is Here ---
    // The context value is wrapped in useMemo to ensure it's stable.
    // It will only be recalculated if 'user' or 'loading' state changes.
    const memoizedValue = useMemo(() => ({
        user,
        loading,
        login,
        logout,
        isAuthenticated: user !== null
    }), [user, loading]);

    return (
        <AuthContext.Provider value={memoizedValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContextProvider;