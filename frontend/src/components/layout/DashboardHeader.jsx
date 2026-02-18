import React from "react";
import { useLocation } from "react-router-dom";

const DashboardHeader = ({ title, links, user, actions, theme = "indigo" }) => {
    const location = useLocation();
    
    // Determine current page title if not explicitly provided
    const currentTitle = title || links.find((l) => location.pathname.startsWith(l.path))?.name || "Dashboard";

    // Theme specific user avatar colors
    const avatarSettings = theme === 'slate' ? {
        bg: "bg-orange-100",
        text: "text-orange-600",
        labelColor: "text-gray-500",
        roleLabel: "Seller Account"
    } : {
        bg: "bg-indigo-100",
        text: "text-indigo-600",
        labelColor: "text-gray-500",
        roleLabel: "Admin Account"
    };

    return (
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8 sticky top-0 z-20">
          <h1 className="text-2xl font-bold text-gray-800">
            {currentTitle}
          </h1>
          <div className="flex items-center gap-4">
             {/* Header Actions */}
             {actions}

             {/* User Profile display for Header (Matches SellerLayout style commonly) */}
             {/* We can make this conditional or standard. AdminLayout didn't have this in header, SellerLayout did. */}
             {/* Let's include it if 'user' is passed and it's not the redundant sidebar one */}
             
             {(theme === 'slate' || !user?.fullname) && user && ( 
                 <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${avatarSettings.bg} ${avatarSettings.text} flex items-center justify-center font-bold`}>
                      {user.fullname?.[0] || "U"}
                    </div>
                    <div className="text-sm hidden md:block">
                        <p className="font-medium text-gray-700">{user.fullname}</p>
                        <p className={`text-xs ${avatarSettings.labelColor}`}>{avatarSettings.roleLabel}</p>
                    </div>
                 </div>
             )}
          </div>
        </header>
    );
};

export default DashboardHeader;
