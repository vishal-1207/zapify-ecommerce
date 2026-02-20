import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  loadUser,
  login,
  loginWithTicket,
  logout,
  resendVerification,
  switchRole as switchRoleAction,
} from "../store/auth/authSlice";

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, role, isLoading } = useSelector((state) => state.auth);

  const refreshUser = async () => {
    await dispatch(loadUser());
  };

  const handleLogin = async (email, password) => {
    const resultAction = await dispatch(login({ email, password }));
    if (login.fulfilled.match(resultAction)) {
      return {
        success: true,
        role: resultAction.payload.role,
        user: resultAction.payload.user,
      };
    } else {
      return {
        success: false,
        message: resultAction.payload || "Login failed",
      };
    }
  };

  const handleLoginWithTicket = async (ticket) => {
    const resultAction = await dispatch(loginWithTicket(ticket));
    if (loginWithTicket.fulfilled.match(resultAction)) {
      return { success: true };
    } else {
      return {
        success: false,
        message: resultAction.payload || "Social login failed",
      };
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleResendVerification = async () => {
    const resultAction = await dispatch(resendVerification());
    if (resendVerification.fulfilled.match(resultAction)) {
      return { success: true, message: resultAction.payload.message };
    } else {
      return {
        success: false,
        message: resultAction.payload || "Failed to send email",
      };
    }
  };

  const switchRole = (newRole) => {
    dispatch(switchRoleAction(newRole));
  };

  return {
    user,
    role,
    login: handleLogin,
    loginWithTicket: handleLoginWithTicket,
    logout: handleLogout,
    resendVerification: handleResendVerification,
    refreshUser,
    switchRole,
    isAuthenticated: !!user,
    isLoading,
  };
};
