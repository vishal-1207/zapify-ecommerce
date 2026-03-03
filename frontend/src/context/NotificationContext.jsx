import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  getMyNotifications,
  markAsRead as apiMarkAsRead,
  clearAllNotifications as apiClearAll,
} from "../api/notifications";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

const POLL_INTERVAL_MS = 60_000; // 60 seconds

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getMyNotifications();
      // data is { count, rows } from findAndCountAll
      setNotifications(data?.rows ?? data ?? []);
    } catch {
      // Silently fail — don't disrupt the UI for a polling error
    }
  }, [user]);

  // Fetch on mount + whenever user changes
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    refresh().finally(() => setLoading(false));

    // Start polling
    intervalRef.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [user, refresh]);

  const markAsRead = useCallback(
    async (ids) => {
      if (!ids || ids.length === 0) return;
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n)),
      );
      try {
        await apiMarkAsRead(ids);
      } catch {
        // Revert on failure
        await refresh();
      }
    },
    [refresh],
  );

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await markAsRead(unreadIds);
  }, [notifications, markAsRead]);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    try {
      await apiClearAll();
    } catch {
      await refresh();
    }
  }, [refresh]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        clearAll,
        refresh,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used inside NotificationProvider",
    );
  return ctx;
};
