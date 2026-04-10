import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  User,
  Settings,
  MapPin,
  Package,
  Heart,
  Star,
  CreditCard,
  Bell,
  Award,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { LogOut, Menu, X } from "lucide-react";

const AccountLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  // Close sidebar when route changes on mobile
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { name: "My Profile", path: "/account", icon: User },
    { name: "My Reviews", path: "/account/reviews", icon: Star },
    { name: "Orders", path: "/account/orders", icon: Package },
    { name: "Wishlist", path: "/account/wishlist", icon: Heart },
    { name: "Transactions", path: "/account/transactions", icon: CreditCard },
    {
      name: "Notifications",
      path: "/account/notifications",
      icon: Bell,
      badge: unreadCount,
    },
    { name: "Affiliate Dashboard", path: "/affiliate/dashboard", icon: Award },
    { name: "Addresses", path: "/account/addresses", icon: MapPin },
    { name: "Settings", path: "/account/settings", icon: Settings },
  ];

  const isActive = (path) => {
    return (
      location.pathname === path ||
      (path === "/account" && location.pathname === "/account/")
    );
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Mobile Toggle Button */}
      <div className="md:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
            {user.fullname?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">
              Account Management
            </p>
            <p className="text-xs text-gray-500 mt-1">Manage your profile & orders</p>
          </div>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
          aria-label="Open Account Menu"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Backdrop Overlay (Mobile only) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-white transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:w-64 shrink-0 shadow-xl md:shadow-none ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-full flex flex-col p-6 md:p-6 bg-white rounded-r-2xl md:rounded-lg overflow-y-auto">
            {/* Mobile Sidebar Header */}
            <div className="md:hidden flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
              <span className="font-bold text-lg text-gray-900">Account Menu</span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close Account Menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl flex-shrink-0">
                {user.fullname?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-gray-900 truncate">{user.fullname}</h2>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
            </div>

            <nav className="space-y-1 flex-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                        : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="flex-1">{item.name}</span>
                    {item.badge > 0 && (
                      <span
                        className={`ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                          active ? "bg-white text-indigo-600" : "bg-indigo-600 text-white"
                        }`}
                      >
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-6 border-t border-gray-100">
              <button
                onClick={logout}
                className="cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} />
                Log Out
              </button>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const LogOutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-log-out"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

export default AccountLayout;
