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
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex h-screen overflow-hidden relative">
      {/* Reusable Sidebar */}
      <Sidebar
        title={sidebarTitle}
        icon={sidebarIcon}
        links={links}
        user={user}
        logout={logout}
        theme={theme}
        footerActions={footerActions}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Reusable Header */}
        <DashboardHeader
          links={links}
          user={user}
          theme={theme}
          actions={headerActions}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
