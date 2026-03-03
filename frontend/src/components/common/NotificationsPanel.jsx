import React, { useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Bell,
  Package,
  Star,
  Tag,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Info,
  Trash2,
  CheckCheck,
  Flame,
  CreditCard,
} from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import { formatDistanceToNow } from "date-fns";

// ── Icon per notification type ─────────────────────────────────────────────
const TYPE_META = {
  order_placed: {
    icon: CheckCircle,
    color: "text-green-500",
    bg: "bg-green-50",
  },
  new_order: { icon: Package, color: "text-indigo-500", bg: "bg-indigo-50" },
  product_suggestion_approved: {
    icon: CheckCircle,
    color: "text-green-500",
    bg: "bg-green-50",
  },
  product_suggestion_rejected: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  order_status_update: {
    icon: Package,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  review_approved: {
    icon: CheckCircle,
    color: "text-green-500",
    bg: "bg-green-50",
  },
  review_rejected: { icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
  product_suggestion: {
    icon: Tag,
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  offer_suggestion: { icon: Tag, color: "text-orange-500", bg: "bg-orange-50" },
  order_suggestion: {
    icon: ShoppingCart,
    color: "text-teal-500",
    bg: "bg-teal-50",
  },
  new_product_suggestion: {
    icon: Tag,
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  new_review_for_moderation: {
    icon: Star,
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  low_stock_wishlist: { icon: Flame, color: "text-red-500", bg: "bg-red-50" },
};

const getTypeMeta = (type) =>
  TYPE_META[type] ?? { icon: Info, color: "text-gray-400", bg: "bg-gray-50" };

// ── Individual notification item ───────────────────────────────────────────
const NotificationItem = ({ notification, onClose }) => {
  const { markAsRead } = useNotifications();
  const navigate = useNavigate();
  const { icon: Icon, color, bg } = getTypeMeta(notification.type);

  const handleClick = () => {
    if (!notification.isRead) markAsRead([notification.id]);
    if (notification.linkUrl) {
      navigate(notification.linkUrl);
      onClose();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`cursor-pointer w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
        !notification.isRead ? "bg-indigo-50/40" : ""
      }`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full ${bg} flex items-center justify-center mt-0.5`}
      >
        <Icon size={15} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug ${!notification.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}
        >
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>
      {!notification.isRead && (
        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500 mt-2" />
      )}
    </button>
  );
};

// ── Main dropdown panel ────────────────────────────────────────────────────
const NotificationsPanel = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAllAsRead, clearAll, loading } =
    useNotifications();
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white sticky top-0">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-indigo-600" />
          <span className="font-bold text-gray-900 text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-indigo-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="cursor-pointer flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
              title="Mark all as read"
            >
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="cursor-pointer flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
              title="Clear all"
            >
              <Trash2 size={13} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Notification list */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-gray-400 text-sm gap-2">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            Loading…
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Bell size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-500">
              You're all caught up!
            </p>
            <p className="text-xs text-gray-400 mt-1">
              New notifications will appear here.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onClose={onClose} />
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50 text-center">
          <Link
            to="/account/notifications"
            onClick={onClose}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
          >
            View all notifications →
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel;
