import React from "react";
import { useNavigate } from "react-router-dom";
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
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

const TYPE_META = {
  order_placed: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-100",
    label: "Order Placed",
  },
  new_order: {
    icon: Package,
    color: "text-indigo-500",
    bg: "bg-indigo-100",
    label: "New Order",
  },
  product_suggestion_approved: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-100",
    label: "Approved",
  },
  product_suggestion_rejected: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-100",
    label: "Rejected",
  },
  order_status_update: {
    icon: Package,
    color: "text-blue-600",
    bg: "bg-blue-100",
    label: "Order Update",
  },
  review_approved: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-100",
    label: "Review Approved",
  },
  review_rejected: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-100",
    label: "Review Rejected",
  },
  product_suggestion: {
    icon: Tag,
    color: "text-purple-600",
    bg: "bg-purple-100",
    label: "Suggestion",
  },
  offer_suggestion: {
    icon: Tag,
    color: "text-orange-600",
    bg: "bg-orange-100",
    label: "Offer",
  },
  order_suggestion: {
    icon: ShoppingCart,
    color: "text-teal-600",
    bg: "bg-teal-100",
    label: "Order Tip",
  },
  new_product_suggestion: {
    icon: Tag,
    color: "text-purple-600",
    bg: "bg-purple-100",
    label: "Suggestion",
  },
  new_review_for_moderation: {
    icon: Star,
    color: "text-yellow-600",
    bg: "bg-yellow-100",
    label: "Review",
  },
  low_stock_wishlist: {
    icon: Flame,
    color: "text-red-600",
    bg: "bg-red-100",
    label: "Almost Gone!",
  },
};
const getTypeMeta = (type) =>
  TYPE_META[type] ?? {
    icon: Info,
    color: "text-gray-400",
    bg: "bg-gray-100",
    label: "Info",
  };

const getDateLabel = (dateStr) => {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
};

const groupByDate = (notifications) => {
  const groups = {};
  notifications.forEach((n) => {
    const label = getDateLabel(n.createdAt);
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });
  return groups;
};

const Notifications = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    loading,
  } = useNotifications();
  const navigate = useNavigate();
  const groups = groupByDate(notifications);

  const handleClick = (notification) => {
    if (!notification.isRead) markAsRead([notification.id]);
    if (notification.linkUrl) navigate(notification.linkUrl);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Bell className="text-indigo-600" size={24} />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up!"}
          </p>
        </div>
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
              >
                <CheckCheck size={15} /> Mark all read
              </button>
            )}
            <button
              onClick={clearAll}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium"
            >
              <Trash2 size={15} /> Clear all
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading && notifications.length === 0 ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse flex gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-100">
          <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
            <Bell size={36} className="text-indigo-200" />
          </div>
          <h3 className="text-lg font-bold text-gray-700">
            No notifications yet
          </h3>
          <p className="text-sm text-gray-400 mt-1 max-w-xs">
            When something important happens — like an order update or a new
            message — you'll see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                {dateLabel}
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                {items.map((n) => {
                  const { icon: Icon, color, bg } = getTypeMeta(n.type);
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`cursor-pointer w-full flex items-start gap-4 p-4 text-left transition-colors hover:bg-gray-50 ${
                        !n.isRead ? "bg-indigo-50/30" : ""
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full ${bg} flex items-center justify-center`}
                      >
                        <Icon size={18} className={color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm leading-snug ${
                            !n.isRead
                              ? "font-semibold text-gray-900"
                              : "text-gray-700"
                          }`}
                        >
                          {n.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(n.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {!n.isRead && (
                        <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
