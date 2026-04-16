import React from "react";
import { Link, useLocation } from "react-router-dom";

const Footer = () => {
  const location = useLocation();
  const isDashboardPath =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/seller");

  if (isDashboardPath) return null;

  return (
    <footer className="bg-gray-900 text-gray-400 py-10 mt-auto text-sm">
      <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h4 className="text-white font-bold mb-4">Get to Know Us</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/about" className="hover:underline">
                About Zapify
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:underline">
                FAQs
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:underline">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">Make Money with Us</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/sell" className="hover:underline">
                Sell on Zapify
              </Link>
            </li>
            <li>
              <Link to="/affiliate" className="hover:underline">
                Affiliate Program
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">Let Us Help You</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/account" className="hover:underline">
                Your Account
              </Link>
            </li>
            <li>
              <Link to="/orders" className="hover:underline">
                Your Orders
              </Link>
            </li>
            <li>
              <Link to="/help" className="hover:underline">
                Help Center
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">Contact</h4>
          <p>1-800-ZAPIFY-HELP</p>
          <p>support@zapify.com</p>
        </div>
      </div>
      <div className="text-center mt-10 pt-6 border-t border-gray-800 text-xs">
        &copy; {new Date().getFullYear()} Zapify, Inc. All rights reserved.
        Developed by Vishal Chaudhary
      </div>
    </footer>
  );
};

export default Footer;
