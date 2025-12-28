/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-use-before-define */
/* eslint-disable react/jsx-no-constructed-context-values */
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  isPremium: boolean;
  emailVerified: boolean;
  createdAt?: string; // Optional for settings page
  profile?: {
    profile?: {
      name?: string;
    };
  }; // Optional nested profile for legacy compatibility
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPremium: boolean;
  emailVerified: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  // Legacy auth methods (stubbed for compatibility)
  restore?: (account: any) => Promise<void>;
  register?: (account: any) => Promise<void>;
  importData?: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state and listen for changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession?.user) {
        setUser(transformUser(initialSession.user));
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, changedSession) => {
      setSession(changedSession);
      if (changedSession?.user) {
        setUser(transformUser(changedSession.user));
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Transform Supabase user to our User interface
  const transformUser = (supabaseUser: SupabaseUser): User => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      role: (supabaseUser.user_metadata?.role as "ADMIN" | "USER") || "USER",
      isPremium: supabaseUser.user_metadata?.is_premium === true,
      emailVerified: supabaseUser.email_confirmed_at != null,
    };
  };

  // Fetch real-time premium status via custom endpoint /who/are-you
  useEffect(() => {
    if (!user?.id || !session?.access_token) return;

    const fetchPremiumStatus = async () => {
      // eslint-disable-next-line no-console
      console.log("[Premium Check] Asking: Who are you?", user.id);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/who-are-you`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const data = await response.json();
        // eslint-disable-next-line no-console
        console.log("[Premium Check] Identity revealed:", data);

        if (response.ok && data.you_are) {
          const isPremiumFromDb = data.you_are.premium === true;

          if (user.isPremium !== isPremiumFromDb) {
            // eslint-disable-next-line no-console
            console.log("[Premium Check] Updating status:", {
              from: user.isPremium,
              to: isPremiumFromDb,
            });
            setUser((prev) =>
              prev ? { ...prev, isPremium: isPremiumFromDb } : null,
            );
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Premium Check] Failed:", error);
      }

      setLoading(false);
    };

    // Only fetch on mount, not on every premium change
    fetchPremiumStatus();

    // Poll for changes every 30 seconds (but don't affect loading state)
    const interval = setInterval(() => {
      fetchPremiumStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.id, session?.access_token]);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.user) {
      setUser(transformUser(data.user));
      setSession(data.session);
    }
  };

  const signup = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          role: "USER",
          is_premium: false,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    // Note: User will need to verify email before they can log in
    // Supabase sends verification email automatically
    if (data.user) {
      setUser(transformUser(data.user));
      setSession(data.session);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAuthenticated: !!user && !!session,
    isAdmin: user?.role?.toUpperCase() === "ADMIN",
    isPremium: user?.isPremium || false,
    emailVerified: user?.emailVerified || false,
    login,
    signup,
    logout,
    resetPassword,
    updatePassword,
    // Legacy auth stubs (no-op for compatibility)
    restore: async () => {},
    register: async () => {},
    importData: async () => {},
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
