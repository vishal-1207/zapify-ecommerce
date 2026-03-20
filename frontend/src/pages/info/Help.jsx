import React from "react";
import { Mail, Phone, MessageSquare, LifeBuoy } from "lucide-react";
import { Link } from "react-router-dom";

const Help = () => {
  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Hero */}
      <div className="bg-indigo-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">How can we help?</h1>
          <p className="text-indigo-100 text-lg max-w-xl mx-auto mb-8">
            Whether you have a question about your order, need technical support, or want to understand our policies, we are here for you.
          </p>
          <div className="max-w-2xl mx-auto bg-white rounded-lg p-2 flex shadow-lg">
            <input 
              type="text" 
              placeholder="Search for answers..." 
              className="flex-1 border-none focus:ring-0 px-4 text-gray-700"
            />
            <button className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 transition">
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-16 max-w-5xl">
        {/* Support Channels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-4">
              <Mail size={24} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Email Support</h3>
            <p className="text-gray-500 text-sm mb-4">Get an answer within 24 hours.</p>
            <a href="mailto:support@zapify.com" className="text-indigo-600 font-medium hover:underline">support@zapify.com</a>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-4">
              <Phone size={24} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Phone Support</h3>
            <p className="text-gray-500 text-sm mb-4">Available Mon-Fri, 9am - 5pm.</p>
            <a href="tel:1-800-ZAPIFY" className="text-indigo-600 font-medium hover:underline">1-800-ZAPIFY</a>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-4">
              <MessageSquare size={24} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Live Chat</h3>
            <p className="text-gray-500 text-sm mb-4">Chat instantly with an agent.</p>
            <button className="text-indigo-600 font-medium hover:underline">Start Chat</button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-4">
              <LifeBuoy size={24} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Self-Service</h3>
            <p className="text-gray-500 text-sm mb-4">Manage your orders easily.</p>
            <Link to="/orders" className="text-indigo-600 font-medium hover:underline">View Orders</Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Requested Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            <Link to="/faq" className="flex items-center justify-between p-4 border rounded-lg hover:border-indigo-500 group transition">
              <span className="font-medium text-gray-800 group-hover:text-indigo-600">How to process a return</span>
              <span className="text-gray-400 group-hover:text-indigo-600">&rarr;</span>
            </Link>
            <Link to="/faq" className="flex items-center justify-between p-4 border rounded-lg hover:border-indigo-500 group transition">
              <span className="font-medium text-gray-800 group-hover:text-indigo-600">When will I receive my refund?</span>
              <span className="text-gray-400 group-hover:text-indigo-600">&rarr;</span>
            </Link>
            <Link to="/faq" className="flex items-center justify-between p-4 border rounded-lg hover:border-indigo-500 group transition">
              <span className="font-medium text-gray-800 group-hover:text-indigo-600">Reporting a defective item</span>
              <span className="text-gray-400 group-hover:text-indigo-600">&rarr;</span>
            </Link>
            <Link to="/faq" className="flex items-center justify-between p-4 border rounded-lg hover:border-indigo-500 group transition">
              <span className="font-medium text-gray-800 group-hover:text-indigo-600">Setting up a Seller Account</span>
              <span className="text-gray-400 group-hover:text-indigo-600">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
