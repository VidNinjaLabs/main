/* eslint-disable react/jsx-no-constructed-context-values */
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

interface User {
  createdAt: string | number | Date;
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  isPremium: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPremium: boolean;
  login: (
    email: string,
    password: string,
    turnstileToken?: string,
  ) => Promise<void>;
  signup: (
    email: string,
    password: string,
    confirmPassword?: string,
    turnstileToken?: string,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      try {
        // Validate JWT expiry
        const tokenParts = storedToken.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const now = Math.floor(Date.now() / 1000);

          if (payload.exp && payload.exp < now) {
            console.log("Token expired, clearing session");
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
            setLoading(false);
            return;
          }
        }

        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string,
    turnstileToken?: string,
  ) => {
    const apiUrl = "/api/auth/login";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, turnstileToken }),
    });

    if (!response.ok) {
      // Try to get error message
      let errorMessage = "Login failed";
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch {
        // If JSON parsing fails, it's likely an HTML error page
        errorMessage = `Server error (${response.status}). Please check Vercel logs.`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Store in state
    setToken(data.token);
    setUser(data.user);

    // Store in localStorage
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
  };

  const signup = async (
    email: string,
    password: string,
    confirmPassword?: string,
    turnstileToken?: string,
  ) => {
    const apiUrl = "/api/auth/signup";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        confirmPassword,
        turnstileToken,
      }),
    });

    if (!response.ok) {
      // Try to get error message
      let errorMessage = "Signup failed";
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch {
        // If JSON parsing fails, it's likely an HTML error page
        errorMessage = `Server error (${response.status}). Please check Vercel logs.`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Store in state
    setToken(data.token);
    setUser(data.user);

    // Store in localStorage
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role?.toUpperCase() === "ADMIN",
    isPremium: user?.isPremium || false,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
