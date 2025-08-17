import { useState, useEffect, createContext, useContext } from "react";
import { queryClient } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean | { needsVerification: true; email: string; message: string; verificationCode?: string }>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ success: boolean; needsVerification?: boolean; email?: string; verificationCode?: string }>;
  verifyEmail: (email: string, code: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<boolean>;
  loginWithOtp: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyOtp: (email: string, code: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        console.log('Auth check successful:', userData.email);
      } else {
        console.log('Auth check failed:', response.status);
        
        // Check for recovery hints in headers
        const recoveryHint = response.headers.get('X-Recovery-Hint');
        const fallbackAction = response.headers.get('X-Fallback-Action');
        
        if (recoveryHint === 'session-expired' && fallbackAction === 'relogin-required') {
          console.log('Session expired, user needs to re-login');
          // Clear any cached settings when session expires
          queryClient.clear();
        }
        
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe = false): Promise<boolean | { needsVerification: true; email: string; message: string; verificationCode?: string }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        // Clear cache and refetch settings on successful login
        console.log('Login successful, invalidating settings cache');
        queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
        queryClient.refetchQueries({ queryKey: ["/api/settings"] });
        return true;
      } else if (response.status === 403) {
        // Handle email verification required
        const errorData = await response.json();
        if (errorData.needsVerification) {
          console.log('Login requires verification, verification email sent');
          return {
            needsVerification: true,
            email,
            message: errorData.message,
            verificationCode: errorData.verificationCode
          };
        }
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const register = async (
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string
  ): Promise<{ success: boolean; needsVerification?: boolean; email?: string }> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      if (response.ok) {
        const userData = await response.json();
        // Don't set user in state until email is verified
        return { 
          success: true, 
          needsVerification: true, 
          email,
          verificationCode: userData.verificationCode 
        } as { success: boolean; needsVerification?: boolean; email?: string; verificationCode?: string };
      }
      return { success: false };
    } catch (error) {
      console.error("Registration failed:", error);
      return { success: false };
    }
  };

  const loginWithOtp = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch("/api/auth/login-with-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      return {
        success: response.ok,
        message: result.message || (response.ok ? "One-time password sent!" : "Failed to send one-time password")
      };
    } catch (error) {
      console.error("OTP request failed:", error);
      return { success: false, message: "Failed to send one-time password" };
    }
  };

  const verifyOtp = async (email: string, code: string, rememberMe = false): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code, rememberMe }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        // Clear cache on successful login
        queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
        queryClient.refetchQueries({ queryKey: ["/api/settings"] });
        return true;
      }
      return false;
    } catch (error) {
      console.error("OTP verification failed:", error);
      return false;
    }
  };

  const sendVerifyLink = async (email: string): Promise<{ success: boolean; message: string; email?: string; verificationCode?: string }> => {
    try {
      const response = await fetch("/api/auth/send-verify-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      return {
        success: response.ok,
        message: result.message || (response.ok ? "Verification link sent!" : "Failed to send verification link"),
        email: result.email,
        verificationCode: result.verificationCode
      };
    } catch (error) {
      console.error("Send verify link failed:", error);
      return { success: false, message: "Failed to send verification link" };
    }
  };

  const verifyLoginCode = async (email: string, code: string, rememberMe = false): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/verify-login-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code, rememberMe }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        // Clear cache on successful login
        queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
        queryClient.refetchQueries({ queryKey: ["/api/settings"] });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login code verification failed:", error);
      return false;
    }
  };

  const verifyEmail = async (email: string, code: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        // Clear cache on successful verification to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
        queryClient.refetchQueries({ queryKey: ["/api/settings"] });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Email verification failed:", error);
      return false;
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      return {
        success: response.ok,
        message: result.message || (response.ok ? "Password reset code sent!" : "Failed to send reset code")
      };
    } catch (error) {
      console.error("Forgot password failed:", error);
      return { success: false, message: "Failed to send reset code" };
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code, newPassword }),
      });

      return response.ok;
    } catch (error) {
      console.error("Reset password failed:", error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      // Clear local storage on logout
      localStorage.removeItem("stepmonkey-input-history");
      
      // Clear React Query cache to ensure fresh data on next login
      queryClient.clear();
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    verifyEmail,
    forgotPassword,
    resetPassword,
    loginWithOtp,
    verifyOtp,
    logout,
  };
}

