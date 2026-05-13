import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const API_URL = "http://localhost:8000/api/auth";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    // On mount, check if token exists and fetch user
    useEffect(() => {
        if (token) {
            fetchUser(token);
        } else {
            setLoading(false);
        }
    }, []);

    async function fetchUser(authToken) {
        try {
            const res = await fetch(`${API_URL}/me`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else {
                // Token is invalid or expired — clear it
                logout();
            }
        } catch (err) {
            console.error("Failed to fetch user:", err);
            logout();
        } finally {
            setLoading(false);
        }
    }

    async function login(email, password) {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || "Login failed");
        }

        const data = await res.json();
        localStorage.setItem("token", data.access_token);
        setToken(data.access_token);
        await fetchUser(data.access_token);
        return data;
    }

    async function register(name, email, password) {
        const res = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || "Registration failed");
        }

        return await res.json();
    }

    function logout() {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    }

    /**
     * Authenticated fetch wrapper.
     * Automatically attaches the JWT token and handles 401 (expired token).
     */
    async function authFetch(url, options = {}) {
        const currentToken = localStorage.getItem("token");
        if (!currentToken) {
            logout();
            throw new Error("Session expired. Please log in again.");
        }

        const headers = { ...options.headers, Authorization: `Bearer ${currentToken}` };
        // Don't set Content-Type for FormData (browser sets it with boundary)
        if (!(options.body instanceof FormData)) {
            headers["Content-Type"] = headers["Content-Type"] || "application/json";
        }

        const res = await fetch(url, { ...options, headers });

        if (res.status === 401) {
            logout();
            throw new Error("Session expired. Please log in again.");
        }

        return res;
    }

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        authFetch,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

