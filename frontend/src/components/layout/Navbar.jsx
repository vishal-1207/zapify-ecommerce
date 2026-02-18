import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Search,
  Menu,
  LogOut,
  LayoutDashboard,
  Zap,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import SearchComponent from "../common/Search";

const Navbar = () => {
  const { role, user, switchRole } = useAuth();
  const { cartCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate("/shop");
  };

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
                    className="hidden lg:flex items-center gap-2 hover:text-orange-300 text-xs font-bold uppercase tracking-wide mr-4"
                  >
                    <LayoutDashboard size={14} /> Admin Panel
                  </button>
                )}

                <button
                  onClick={() => {
                    if (user?.roles?.includes("seller")) {
                      switchRole("seller");
                      navigate("/seller/dashboard");
                    } else {
                      // Not a seller yet, maybe go to register?
                      // For now keep switchRole to let them see the 'Become a Seller' view if it existed,
                      // or redirect to seller register.
                      navigate("/seller/register");
                    }
                  }}
                  className="hidden lg:flex items-center gap-2 hover:text-orange-300 text-xs font-bold uppercase tracking-wide"
                >
                  {user?.roles?.includes("seller") ? (
                    <>
                      <LayoutDashboard size={14} /> Seller Dashboard
                    </>
                  ) : (
                    "Sell Tech"
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
                className="flex items-center gap-1 bg-indigo-800 border border-indigo-600 px-3 py-1 rounded text-xs hover:bg-indigo-900"
              >
                <LogOut size={14} /> Exit {role}
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
                className="flex flex-col cursor-pointer leading-tight hover:text-orange-300"
              >
                <span className="text-[10px] opacity-80">
                  Hello, {user ? user.fullname : "Sign in"}
                </span>
                <span className="font-bold flex items-center gap-1">
                  {role === "user" ? "Account" : "Dashboard"}
                  {role !== "user" && <LayoutDashboard size={14} />}
                </span>
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
              className="md:hidden"
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
              className="block py-2 font-medium"
            >
              Home
            </Link>
            <Link
              to="/shop"
              onClick={() => setIsMenuOpen(false)}
              className="block py-2 font-medium"
            >
              All Electronics
            </Link>
            {user && (
              <Link
                to="/account/orders"
                onClick={() => setIsMenuOpen(false)}
                className="block py-2 font-medium"
              >
                My Orders
              </Link>
            )}
          </div>
        )}
      </nav>

      {(role === "user" || !user) && (
        <div className="hidden md:flex bg-indigo-900 text-indigo-100 text-xs py-2 px-4 gap-6 overflow-x-auto border-b border-indigo-800">
          <Link
            to="/shop"
            className="font-bold hover:text-white flex items-center gap-1"
          >
            <Menu size={14} /> All Electronics
          </Link>
          {[
            "Smartphones",
            "Laptops",
            "Audio",
            "Gaming",
            "Cameras",
            "Wearables",
            "Accessories",
          ].map((cat) => (
            <Link
              key={cat}
              to="/shop"
              className="hover:text-white cursor-pointer transition-colors"
            >
              {cat}
            </Link>
          ))}
          <Link
            to="/shop"
            className="hover:text-white ml-auto font-bold text-orange-400"
          >
            Daily Deals
          </Link>
        </div>
      )}
    </>
  );
};

export default Navbar;
