import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";

const DashboardLayout = ({
  sidebarTitle,
  sidebarIcon,
  links,
  user,
  logout,
  theme = "indigo",
  footerActions,
  headerActions,
}) => {
  return (
    <div className="min-h-screen bg-gray-100 flex h-screen overflow-hidden">
      {/* Reusable Sidebar */}
      <Sidebar
        title={sidebarTitle}
        icon={sidebarIcon}
        links={links}
        user={user}
        logout={logout}
        theme={theme}
        footerActions={footerActions}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Reusable Header */}
        <DashboardHeader
            links={links}
            user={user}
            theme={theme}
            actions={headerActions}
        />

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
