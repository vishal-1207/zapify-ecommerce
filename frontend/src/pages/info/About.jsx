import React from "react";
import { Store, Shield, Zap, Globe } from "lucide-react";

const About = () => {
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Hero */}
      <div className="bg-gray-900 border-b border-gray-800 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            About Zapify
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            Empowering sellers and delighting buyers through a seamless, 
            lightning-fast e-commerce experience.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pt-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-10">
            Zapify was founded with a simple goal: to create a marketplace where speed, quality, and 
            trust converge. We believe that shopping online should be an electrifying experience, 
            free from friction and full of discovery. Whether you are an independent creator 
            launching your first brand or a shopper looking for the perfect gift, Zapify is built 
            for you.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Lightning Fast</h3>
                <p className="text-gray-600">From our search engine to our checkout flow, everything is optimized for speed.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Store size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Seller First</h3>
                <p className="text-gray-600">We provide powerful premium tools to help our merchants grow their businesses natively.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Secure & Trusted</h3>
                <p className="text-gray-600">Advanced AI moderation and rigorous seller verification protect everyone on the platform.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Globe size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Global Reach</h3>
                <p className="text-gray-600">Connecting buyers and sellers across the globe with transparent shipping and tracking.</p>
              </div>
            </div>
          </div>

          <hr className="border-gray-100 my-10" />

          <h2 className="text-3xl font-bold text-gray-900 mb-6">Join the Journey</h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            We are just getting started. As we continue to ship new features and expand our catalog, 
            we invite you to join our growing community. Sell your products or discover something new today.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
