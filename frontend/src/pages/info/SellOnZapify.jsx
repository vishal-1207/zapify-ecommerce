import React from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Users, ShieldCheck, Zap } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const SellOnZapify = () => {
  const { isAuthenticated } = useAuth();
  const ctaRoute = isAuthenticated ? "/seller/dashboard" : "/register";

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="bg-indigo-700 text-white py-20">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            Grow your business with Zapify
          </h1>
          <p className="text-xl md:text-2xl text-indigo-100 max-w-3xl mx-auto mb-10">
            Reach millions of shoppers, enjoy transparent pricing, and scale your brand with our powerful premium seller tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to={ctaRoute} 
              className="bg-white text-indigo-700 font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:bg-gray-50 hover:scale-105 transition-all"
            >
              Start Selling Today
            </Link>
            <Link 
              to="/faq" 
              className="bg-indigo-600 text-white border border-indigo-400 font-bold text-lg px-8 py-4 rounded-xl hover:bg-indigo-500 transition-colors"
            >
              Read Seller FAQs
            </Link>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why sell on Zapify?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">We provide the infrastructure and audience you need to succeed, while taking the lowest platform fees in the industry.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <Users size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Massive Audience</h3>
              <p className="text-gray-600">Instantly tap into our network of highly engaged shoppers looking for premium products.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <TrendingUp size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Transparent Fees</h3>
              <p className="text-gray-600">Keep more of what you earn with a flat 5% transaction fee. No hidden listing fees or subscriptions.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <Zap size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast Payouts</h3>
              <p className="text-gray-600">Connected via Stripe, you'll receive your funds automatically and securely directly to your bank.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Seller Protection</h3>
              <p className="text-gray-600">Our robust fraud detection and AI-moderated reviews ensure you do business securely.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Bottom */}
      <div className="py-20">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to launch your store?</h2>
          <p className="text-xl text-gray-600 mb-10">Join thousands of successful sellers already making a living on Zapify.</p>
          <Link 
            to={ctaRoute} 
            className="inline-block bg-indigo-600 text-white font-bold text-xl px-12 py-5 rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all"
          >
            Create Your Seller Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SellOnZapify;
