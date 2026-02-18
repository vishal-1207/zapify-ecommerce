import React, { createContext, useState, useContext, useEffect } from "react";
import {
  loginUser,
  getUserProfile,
  exchangeTicket,
  resendEmailVerification,
} from "../api/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("guest");
  const [isLoading, setIsLoading] = useState(true);

  // Load User Function
  const loadUser = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const res = await getUserProfile();
        if (res.user) {
          setUser(res.user);
          // Prioritize admin role for initial state, otherwise default to user (even for sellers)
          const userRoles = res.user.roles || ["user"];
          const initialRole = userRoles.includes("admin") ? "admin" : "user";
          setRole(initialRole);
        }
      } catch (error) {
        console.error("Failed to load user profile", error);
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  };

  // Load User on Mount
  useEffect(() => {
    loadUser();
  }, []);

  const refreshUser = async () => {
    await loadUser();
  };

  const login = async (email, password) => {
    try {
      const res = await loginUser(email, password);

      if (res.success || res.accessToken) {
        localStorage.setItem("token", res.accessToken);
        // If the login response includes user data, set it immediately
        let loggedInUser = null;
        let loggedInRole = "user";

        if (res.user) {
          loggedInUser = res.user;
          const userRoles = res.user.roles || ["user"];
          loggedInRole = userRoles.includes("admin") ? "admin" : "user";
          setUser(loggedInUser);
          setRole(loggedInRole);
        } else {
          // Otherwise fetch profile
          const profileRes = await getUserProfile();
          loggedInUser = profileRes.user;
          const userRoles = profileRes.user.roles || ["user"];
          loggedInRole = userRoles.includes("admin") ? "admin" : "user";
          setUser(loggedInUser);
          setRole(loggedInRole);
        }
        return { success: true, role: loggedInRole, user: loggedInUser };
      }
      return { success: false, message: res.message || "Login failed" };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Invalid email or password",
      };
    }
  };

  const loginWithTicket = async (ticket) => {
    try {
      const res = await exchangeTicket(ticket);
      if (res.accessToken) {
        localStorage.setItem("token", res.accessToken);
        if (res.user) {
          setUser(res.user);
          const userRoles = res.user.roles || ["user"];
          const initialRole = userRoles.includes("admin") ? "admin" : "user";
          setRole(initialRole);
        } else {
          const profileRes = await getUserProfile();
          setUser(profileRes.user);
          const userRoles = profileRes.user.roles || ["user"];
          const initialRole = userRoles.includes("admin") ? "admin" : "user";
          setRole(initialRole);
        }
        return { success: true };
      }
      return { success: false, message: "Token exchange failed" };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Social login failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setRole("guest");
    window.location.href = "/login";
  };

  const resendVerification = async () => {
    if (!user?.email) return { success: false, message: "No email found" };
    try {
      await resendEmailVerification(user.email);
      return { success: true, message: "Verification email sent!" };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to send email",
      };
    }
  };

  const switchRole = (newRole) => {
    setRole(newRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        login,
        loginWithTicket,
        logout,
        resendVerification,
        refreshUser,
        switchRole,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
