import React from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Megaphone,
  CreditCard,
  Zap,
  Store,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";

const SellerLayout = () => {
  const { logout, user, switchRole, role } = useAuth();
  const navigate = useNavigate();

  // Ensure user is in seller mode when accessing dashboard
  React.useEffect(() => {
    if (role !== "seller") {
      switchRole("seller");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount to avoid loops during exit

  const links = [
    { name: "Dashboard", path: "/seller/dashboard", icon: LayoutDashboard },
    { name: "My Products", path: "/seller/products", icon: Package },
    { name: "Orders", path: "/seller/orders", icon: ShoppingCart },
    { name: "Offers/Deals", path: "/seller/offers", icon: Megaphone },
    { name: "Payments", path: "/seller/payments", icon: CreditCard },
  ];

  const footerActions = (
    <button
      type="button"
      onClick={() => {
        switchRole("user");
        setTimeout(() => navigate("/"), 0);
      }}
      className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700 mb-2"
    >
      <Zap size={20} />
      <span className="font-medium">Switch to Buying</span>
    </button>
  );

  return (
    <DashboardLayout
      sidebarTitle="Seller Central"
      sidebarIcon={Store}
      links={links}
      user={user}
      logout={logout}
      theme="slate"
      footerActions={footerActions}
    />
  );
};

export default SellerLayout;
