import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Package } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-indigo-600 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center relative z-10">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <span className="bg-indigo-500/30 text-indigo-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
              New Arrivals
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Next Gen <br /> Tech is Here.
            </h1>
            <p className="text-xl text-indigo-100 mb-8 max-w-lg leading-relaxed">
              Experience the future with our curated collection of premium
              electronics and lifestyle gear.
            </p>
            <Link
              to="/shop"
              className="bg-white text-indigo-700 px-8 py-3.5 rounded-full font-bold hover:bg-gray-100 hover:shadow-lg hover:scale-105 transition flex items-center gap-2 w-fit"
            >
              Shop Collection <ArrowRight size={18} />
            </Link>
          </div>
          {/* Abstract Shape for visual interest */}
          <div className="md:w-1/2 flex justify-center">
            <div className="w-64 h-64 md:w-80 md:h-80 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-2xl animate-pulse">
              <span className="text-6xl">🛍️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Quad-Cards */}
      <div className="container mx-auto px-4 -mt-16 relative z-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {["Electronics", "Fashion", "Home Office"].map((cat, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">{cat}</h3>
                <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                  <Package size={20} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[1, 2, 3, 4].map((j) => (
                  <div
                    key={j}
                    className="bg-gray-100 rounded-lg aspect-square"
                  ></div>
                ))}
              </div>
              <Link
                to="/shop"
                className="text-indigo-600 text-sm font-bold hover:underline flex items-center gap-1"
              >
                Explore {cat} <ChevronRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
