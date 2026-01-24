import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Search,
  Menu,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

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
      <nav className="bg-indigo-600 text-white sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 cursor-pointer min-w-fit"
          >
            <div className="bg-white text-indigo-600 p-1 rounded font-bold">
              Z
            </div>
            <span className="text-xl font-bold tracking-tight">Zapify</span>
          </Link>

          {/* Search Bar (Hidden on mobile) */}
          <div className="hidden md:flex flex-1 max-w-2xl relative">
            <form
              onSubmit={handleSearch}
              className="flex w-full bg-white rounded-lg overflow-hidden p-0.5"
            >
              <select className="bg-gray-100 text-gray-700 text-xs px-3 border-r border-gray-200 outline-none cursor-pointer hover:bg-gray-200">
                <option>All</option>
                <option>Electronics</option>
                <option>Fashion</option>
              </select>
              <input
                type="text"
                placeholder="Search products..."
                className="flex-1 px-4 text-gray-800 outline-none"
              />
              <button
                type="submit"
                className="bg-orange-400 hover:bg-orange-500 text-indigo-900 p-2 transition"
              >
                <Search size={20} />
              </button>
            </form>
          </div>

          {/* Right Menu Icons */}
          <div className="flex items-center gap-4 md:gap-6 text-sm">
            {/* Seller/Admin Toggles (For Demo) */}
            {role === "user" ? (
              <button
                onClick={() => switchRole("seller")}
                className="hidden lg:block hover:text-orange-300 text-xs font-medium"
              >
                Become a Seller
              </button>
            ) : (
              <button
                onClick={() => switchRole("user")}
                className="flex items-center gap-1 bg-indigo-800 px-3 py-1 rounded text-xs"
              >
                <LogOut size={14} /> Exit {role}
              </button>
            )}

            {/* Account Link */}
            <Link
              to={role === "user" ? "/account" : `/${role}/dashboard`}
              className="flex flex-col cursor-pointer leading-tight hover:text-orange-300"
            >
              <span className="text-[10px] opacity-80">
                Hello, {user ? user.name : "Sign in"}
              </span>
              <span className="font-bold flex items-center gap-1">
                {role === "user" ? "Account" : "Dashboard"}
                {role !== "user" && <LayoutDashboard size={14} />}
              </span>
            </Link>

            {/* Cart (Only for Users) */}
            {role === "user" && (
              <Link
                to="/cart"
                className="relative cursor-pointer flex items-end gap-1 hover:text-orange-300"
              >
                <ShoppingCart size={26} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-indigo-900 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
                <span className="font-bold hidden md:inline">Cart</span>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-indigo-700 p-4 space-y-4 shadow-inner">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="block py-2"
            >
              Home
            </Link>
            <Link
              to="/shop"
              onClick={() => setIsMenuOpen(false)}
              className="block py-2"
            >
              Shop Categories
            </Link>
            <Link
              to="/orders"
              onClick={() => setIsMenuOpen(false)}
              className="block py-2"
            >
              My Orders
            </Link>
          </div>
        )}
      </nav>

      {/* Secondary Nav (Categories - Desktop Only) */}
      {role === "user" && (
        <div className="hidden md:flex bg-indigo-900 text-indigo-100 text-xs py-2 px-4 gap-6 overflow-x-auto">
          <Link
            to="/shop"
            className="font-bold hover:text-white flex items-center gap-1"
          >
            <Menu size={14} /> All
          </Link>
          <Link to="/shop" className="hover:text-white">
            Today's Deals
          </Link>
          <Link to="/shop" className="hover:text-white">
            Customer Service
          </Link>
          <Link to="/shop" className="hover:text-white">
            Registry
          </Link>
          <Link to="/shop" className="hover:text-white">
            Gift Cards
          </Link>
          <Link to="/shop" className="hover:text-white ml-auto font-bold">
            New Releases in Electronics
          </Link>
        </div>
      )}
    </>
  );
};

export default Navbar;
