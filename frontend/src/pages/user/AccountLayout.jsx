import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { User, Settings, MapPin, Package } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const AccountLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const menuItems = [
    { name: "My Profile", path: "/account", icon: User },
    { name: "Orders", path: "/account/orders", icon: Package },
    { name: "Addresses", path: "/account/addresses", icon: MapPin },
    { name: "Settings", path: "/account/settings", icon: Settings },
  ];

  const isActive = (path) => {
    return location.pathname === path || (path === "/account" && location.pathname === "/account/");
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                {user.fullname?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{user.fullname}</h2>
                <p className="text-sm text-gray-500 truncate max-w-[150px]">{user.email}</p>
              </div>
            </div>
            
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon size={18} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOutIcon />
                Log Out
              </button>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1">
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" x2="9" y1="12" y2="12"/>
    </svg>
);

export default AccountLayout;
