import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10 mt-auto text-sm">
      <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h4 className="text-white font-bold mb-4">Get to Know Us</h4>
          <ul className="space-y-2">
            <li>
              <Link to="#" className="hover:underline">
                About Zapify
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:underline">
                Careers
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:underline">
                Press
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">Make Money with Us</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/seller/dashboard" className="hover:underline">
                Sell on Zapify
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:underline">
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
              <Link to="#" className="hover:underline">
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
      </div>
    </footer>
  );
};

export default Footer;
