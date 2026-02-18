import React from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Star,
  Zap,
  Layers,
  Tag,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";

const AdminLayout = () => {
  const { logout, user } = useAuth();

  const links = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Products", path: "/admin/products", icon: Package },
    { name: "Categories", path: "/admin/categories", icon: Layers },
    { name: "Brands", path: "/admin/brands", icon: Tag },
    { name: "Orders", path: "/admin/orders", icon: ShoppingCart },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Reviews", path: "/admin/reviews", icon: Star },
  ];

  return (
    <DashboardLayout
      sidebarTitle="Admin Generic"
      sidebarIcon={Zap}
      links={links}
      user={user}
      logout={logout}
      theme="indigo"
    />
  );
};

export default AdminLayout;
