import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";

// Theme configurations
const themes = {
  indigo: {
    sidebarBg: "bg-indigo-900",
    sidebarBorder: "border-indigo-800",
    iconBg: "bg-white",
    iconColor: "text-indigo-900",
    linkActive: "bg-indigo-800 text-white shadow-sm",
    linkInactive: "text-indigo-200 hover:bg-indigo-800 hover:text-white",
    userAvatarBg: "bg-indigo-700",
    userTextSub: "text-indigo-300",
    logoutBtn: "text-indigo-200 hover:text-red-400 hover:bg-indigo-950",
  },
  slate: {
    sidebarBg: "bg-slate-900",
    sidebarBorder: "border-slate-800",
    iconBg: "bg-orange-500",
    iconColor: "text-white",
    linkActive: "bg-orange-600 text-white shadow-sm",
    linkInactive: "text-slate-300 hover:bg-slate-800 hover:text-white",
    userAvatarBg: "bg-slate-700", // Not used in footer but good to have
    userTextSub: "text-slate-400",
    logoutBtn: "text-slate-300 hover:text-red-400 hover:bg-slate-800",
  },
};

const Sidebar = ({
  title,
  icon: Icon,
  links,
  user,
  logout,
  theme = "indigo",
  footerActions,
}) => {
  const location = useLocation();
  const currentTheme = themes[theme] || themes.indigo;

  return (
    <aside
      className={`w-64 ${currentTheme.sidebarBg} text-white flex-shrink-0 flex flex-col transition-colors duration-300`}
    >
      {/* Sidebar Header / Brand */}
      <div
        className={`p-6 border-b ${currentTheme.sidebarBorder} flex items-center gap-2`}
      >
        <div className={`${currentTheme.iconBg} ${currentTheme.iconColor} p-1.5 rounded-lg`}>
          {Icon && <Icon size={20} fill="currentColor" />}
        </div>
        <span className="text-xl font-bold tracking-tight">{title}</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? currentTheme.linkActive : currentTheme.linkInactive
              }`}
            >
              <link.icon size={20} />
              <span className="font-medium">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Section */}
      <div className={`p-4 border-t ${currentTheme.sidebarBorder} space-y-2`}>
        
        {/* Optional Footer Actions (e.g., Switch Role) */}
        {footerActions}

        {/* User Profile (Only for Indigo theme currently, matches AdminLayout) */}
        {theme === "indigo" && user && (
           <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className={`w-8 h-8 rounded-full ${currentTheme.userAvatarBg} flex items-center justify-center font-bold`}>
              {user.fullname?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.fullname}</p>
              <p className={`text-xs ${currentTheme.userTextSub} truncate`}>{user.email}</p>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${currentTheme.logoutBtn}`}
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
        
      </div>
    </aside>
  );
};

export default Sidebar;
