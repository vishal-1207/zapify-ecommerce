import React from "react";
import { useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const DashboardHeader = ({
  title,
  links,
  user,
  actions,
  theme = "indigo",
  toggleSidebar,
  isSidebarOpen,
}) => {
  const location = useLocation();

  const currentTitle =
    title ||
    links.find((l) => location.pathname.startsWith(l.path))?.name ||
    "Dashboard";

  const avatarSettings =
    theme === "slate"
      ? {
          bg: "bg-orange-100",
          text: "text-orange-600",
          labelColor: "text-gray-500",
          roleLabel: "Seller Account",
        }
      : {
          bg: "bg-indigo-100",
          text: "text-indigo-600",
          labelColor: "text-gray-500",
          roleLabel: "Admin Account",
        };

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-20 w-full">
      <div className="flex items-center gap-4">
        {/* Mobile Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate max-w-[150px] sm:max-w-none">
          {currentTitle}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Header Actions */}
        {actions}

        {(theme === "slate" || !user?.fullname) && user && (
          <div className="hidden md:flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full ${avatarSettings.bg} ${avatarSettings.text} flex items-center justify-center font-bold flex-shrink-0`}
            >
              {user.fullname?.[0] || "U"}
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-700">{user.fullname}</p>
              <p className={`text-xs ${avatarSettings.labelColor}`}>
                {avatarSettings.roleLabel}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default DashboardHeader;
