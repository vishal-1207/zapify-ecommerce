import React from "react";
import { DollarSign, Share2, Award } from "lucide-react";

const Affiliate = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="bg-teal-700 text-white py-20">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            Zapify Affiliate Program
          </h1>
          <p className="text-xl md:text-2xl text-teal-100 max-w-3xl mx-auto mb-10">
            Earn up to 10% commission on every qualifying purchase you refer to Zapify.
          </p>
          <button className="bg-white text-teal-700 font-bold text-lg px-10 py-4 rounded-xl shadow-lg hover:bg-gray-50 hover:scale-105 transition-all">
            Join the Program
          </button>
        </div>
      </div>

      {/* How it Works */}
      <div className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Get up and running in three simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 mb-6">
                <Share2 size={36} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">1. Recommend</h3>
              <p className="text-gray-600 leading-relaxed">
                Share products or your favorite Zapify stores on your website, blog, or social media channels using our tailored link-building tools.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 mb-6">
                <Award size={36} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">2. Qualify</h3>
              <p className="text-gray-600 leading-relaxed">
                When your audience clicks your links and makes a qualifying purchase within our 30-day cookie window, you get credited for the sale.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 mb-6">
                <DollarSign size={36} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">3. Earn</h3>
              <p className="text-gray-600 leading-relaxed">
                Earn competitive commission rates up to 10%. Payouts are directly deposited into your linked bank account every month.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ / Details */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">How do I qualify for this program?</h3>
              <p className="text-gray-600">Bloggers, publishers, and content creators with a qualifying website or mobile app can participate. We review applications to ensure they meet our quality bar.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">How do I earn in this program?</h3>
              <p className="text-gray-600">You earn from qualifying purchases through the traffic you drive to Zapify. Commission rates differ depending on the product category purchased.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">How do I sign up?</h3>
              <p className="text-gray-600">Click the "Join the Program" button at the top of the page. You will be prompted to create a Zapify Account and fill out your media kit details for our review team.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Affiliate;
