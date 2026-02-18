import api from "./axios";

// Login User (Matches loginController: userId, password)
export const loginUser = async (userId, password) => {
  const response = await api.post("/auth/login", { userId, password });
  return response.data.data;
};

// Register User (Matches registerController: fullname, username, email, password)
export const registerUser = async (userData) => {
  // userData should contain: { fullname, username, email, password }
  const response = await api.post("/auth/register", userData);
  return response.data.data;
};

// Forgot Password
export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data; // Keep generic for message
};

// Reset Password
export const resetPassword = async (token, newPassword) => {
  const response = await api.post(`/auth/reset-password/${token}`, {
    token,
    newPassword,
  });
  return response.data; // Keep generic for message
};

// Refresh Token
export const refreshToken = async () => {
  const response = await api.post("/auth/refresh-token");
  return response.data.data;
};

// Logout
export const logoutUser = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

// Get Profile
export const getUserProfile = async () => {
  const response = await api.get("/user/profile");
  return response.data.data;
};

// Exchange Ticket
export const exchangeTicket = async (ticket) => {
  const response = await api.post("/auth/social/exchange", { ticket });
  return response.data.data;
};

// Get CSRF Token
export const getCsrfToken = async () => {
  const response = await api.get("/token/csrf-token");
  return response.data; // Expected: { csrfToken: "..." } - backend might not use ApiResponse here? checking...
};

// Resend Email Verification
export const resendEmailVerification = async (email) => {
  const response = await api.post("/otp/send-code/email", { email });
  return response.data;
};

// Verify Email with OTP
export const verifyEmail = async (code) => {
  const response = await api.post("/otp/email/verify", { code });
  return response.data.data;
};
