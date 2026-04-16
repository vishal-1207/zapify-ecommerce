import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  Menu,
  LogOut,
  LayoutDashboard,
  Zap,
  Bell,
  User,
  ShieldCheck,
  Store,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import SearchComponent from "../common/Search";
import NotificationsPanel from "../common/NotificationsPanel";
import { getAllCategories } from "../../api/categories";

const Navbar = () => {
  const { role, user, switchRole } = useAuth();
  const { cartCount } = useCart();
  const { unreadCount } = useNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    getAllCategories()
      .then((data) => setCategories(data))
      .catch((error) =>
        console.error("Failed to load categories in navbar", error),
      );
  }, []);

  useEffect(() => {
    const isDashboardPath =
      location.pathname.startsWith("/admin") ||
      location.pathname.startsWith("/seller");
    if (
      !isDashboardPath &&
      role !== "user" &&
      role !== "guest" &&
      user?.roles?.includes("user")
    ) {
      switchRole("user");
    }
  }, [role, switchRole, user, location.pathname]);

  return (
    <>
      <nav className="bg-indigo-700 text-white sticky top-0 z-[100] shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 cursor-pointer min-w-fit group"
          >
            <div className="bg-white text-indigo-700 p-1.5 rounded-lg font-black group-hover:rotate-12 transition-transform">
              <Zap size={20} fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tighter">
              Zapify<span className="text-orange-400">.</span>
            </span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-2xl relative">
            <SearchComponent />
          </div>

          <div className="flex items-center gap-4 md:gap-6 text-sm">
            {role === "user" && (
              <>
                {user?.roles?.includes("admin") && (
                  <button
                    onClick={() => {
                      switchRole("admin");
                      navigate("/admin/dashboard");
                    }}
                    title="Admin Panel"
                    className="cursor-pointer flex items-center gap-2 hover:text-orange-300 text-xs font-bold uppercase tracking-wide mr-2 md:mr-4"
                  >
                    <ShieldCheck size={20} className="lg:hidden" />
                    <span className="hidden lg:flex items-center gap-2">
                      <LayoutDashboard size={14} /> Admin Panel
                    </span>
                  </button>
                )}

                <button
                  onClick={() => {
                    if (user?.roles?.includes("seller")) {
                      switchRole("seller");
                      navigate("/seller/dashboard");
                    } else {
                      navigate("/seller/register");
                    }
                  }}
                  title={
                    user?.roles?.includes("seller")
                      ? "Seller Dashboard"
                      : "Sell Tech"
                  }
                  className="cursor-pointer flex items-center gap-2 hover:text-orange-300 text-xs font-bold uppercase tracking-wide"
                >
                  {user?.roles?.includes("seller") ? (
                    <>
                      <Store size={20} className="lg:hidden" />
                      <span className="hidden lg:flex items-center gap-2">
                        <LayoutDashboard size={14} /> Seller Dashboard
                      </span>
                    </>
                  ) : (
                    <span className="hidden md:block">Sell Tech</span>
                  )}
                </button>
              </>
            )}

            {role !== "user" && role !== "guest" && (
              <button
                onClick={() => {
                  switchRole("user");
                  navigate("/");
                }}
                className="flex items-center justify-center bg-indigo-800 border border-indigo-600 w-8 h-8 rounded hover:bg-indigo-900 transition-colors cursor-pointer group/exit"
                title={`Exit ${role}`}
              >
                <LogOut
                  size={16}
                  className="group-hover/exit:-translate-x-0.5 transition-transform"
                />
              </button>
            )}

            <div className="relative group">
              <Link
                to={
                  user
                    ? role === "user"
                      ? "/account"
                      : `/${role}/dashboard`
                    : "/login"
                }
                title={role === "user" ? "Account" : "Dashboard"}
                className="flex items-center gap-2 cursor-pointer leading-tight hover:text-orange-300"
              >
                <div className="sm:hidden flex items-center justify-center bg-indigo-800 rounded-full w-8 h-8">
                  {role === "user" ? (
                    <User size={18} />
                  ) : (
                    <LayoutDashboard size={18} />
                  )}
                </div>

                <div className="hidden sm:flex flex-col">
                  <span className="text-[10px] opacity-80">
                    Hello, {user ? user.fullname.split(" ")[0] : "Sign in"}
                  </span>
                  <span className="font-bold flex items-center gap-1">
                    {role === "user" ? "Account" : "Dashboard"}
                    {role !== "user" && <LayoutDashboard size={14} />}
                  </span>
                </div>
              </Link>

              {!user && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-md shadow-xl p-4 hidden group-hover:block z-50 before:content-[''] before:absolute before:-top-2 before:right-6 before:border-l-8 before:border-r-8 before:border-b-8 before:border-l-transparent before:border-r-transparent before:border-b-white">
                  <div className="flex flex-col items-center gap-3">
                    <Link
                      to="/login"
                      className="w-full bg-amber-400 hover:bg-amber-500 text-indigo-900 font-bold py-2 rounded-md transition text-center shadow-sm"
                    >
                      Sign in
                    </Link>
                    <div className="text-xs text-gray-600">
                      New customer?{" "}
                      <Link
                        to="/register"
                        className="text-indigo-600 hover:text-orange-500 hover:underline"
                      >
                        Start here.
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell — only for logged-in users */}
            {user && role === "user" && (
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((o) => !o)}
                  className="cursor-pointer relative flex items-center hover:text-orange-300 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell size={24} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-indigo-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-indigo-700 leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationsPanel
                  isOpen={notifOpen}
                  onClose={() => setNotifOpen(false)}
                />
              </div>
            )}

            {(role === "user" || !user) && (
              <Link
                to="/cart"
                className="relative cursor-pointer flex items-end gap-1 hover:text-orange-300"
              >
                <ShoppingCart size={26} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-indigo-900 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-indigo-700">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            <button
              className="cursor-pointer md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu />
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-indigo-800 p-4 space-y-4 shadow-inner">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="cursor-pointer block py-2 font-medium"
            >
              Home
            </Link>
            <Link
              to="/shop"
              onClick={() => setIsMenuOpen(false)}
              className="cursor-pointer block py-2 font-medium"
            >
              All Electronics
            </Link>
            {user && (
              <Link
                to="/account/orders"
                onClick={() => setIsMenuOpen(false)}
                className="cursor-pointer block py-2 font-medium"
              >
                My Orders
              </Link>
            )}
            {role === "user" && (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  if (user?.roles?.includes("seller")) {
                    switchRole("seller");
                    navigate("/seller/dashboard");
                  } else {
                    navigate("/seller/register");
                  }
                }}
                className="cursor-pointer block w-full text-left py-2 font-medium"
              >
                {user?.roles?.includes("seller") ? "Seller Dashboard" : "Sell Tech"}
              </button>
            )}
          </div>
        )}
      </nav>

      {(role === "user" || !user) && (
        <div className="hidden md:flex bg-indigo-900 text-indigo-100 text-xs py-2 px-4 gap-6 overflow-x-auto border-b border-indigo-800">
          <Link
            to="/shop"
            className="font-bold hover:text-white flex items-center gap-1 shrink-0"
          >
            <Menu size={14} /> All Electronics
          </Link>
          {categories.slice(0, 8).map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="hover:text-white cursor-pointer transition-colors whitespace-nowrap"
            >
              {cat.name}
            </Link>
          ))}
          <Link
            to="/shop"
            className="hover:text-white ml-auto font-bold text-orange-400 shrink-0"
          >
            Daily Deals
          </Link>
        </div>
      )}
    </>
  );
};

export default Navbar;
