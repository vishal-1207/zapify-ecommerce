import React, { createContext, useState, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Mocking initial state. In production, check localStorage for token.
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("user"); // 'user' | 'seller' | 'admin'

  // Mock Login Function
  const login = (email, password) => {
    // SIMULATION: Logic to switch roles for testing purposes
    if (email.includes("seller")) {
      setUser({ name: "Seller Jane", email });
      setRole("seller");
    } else if (email.includes("admin")) {
      setUser({ name: "Admin Mike", email });
      setRole("admin");
    } else {
      setUser({ name: "John Doe", email });
      setRole("user");
    }
  };

  const logout = () => {
    setUser(null);
    setRole("user");
    // localStorage.removeItem('token');
  };

  const switchRole = (newRole) => {
    // Helper for dev toolbar to quickly jump between views
    setRole(newRole);
  };

  return (
    <AuthContext.Provider
      value={{ user, role, login, logout, switchRole, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
