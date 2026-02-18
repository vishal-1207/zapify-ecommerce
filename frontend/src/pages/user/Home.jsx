import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  Smartphone,
  Laptop,
  Headphones,
  Gamepad,
  Camera,
  Watch,
  Zap,
} from "lucide-react";
import CategoryCarousel from "../../components/home/CategoryCarousel";
import BrandCarousel from "../../components/home/BrandCarousel";
import ProductCarousel from "../../components/product/ProductCarousel";
import { getAllCategories } from "../../api/categories";
import {
  getFeaturedProducts,
  getNewArrivals,
  getPopularProducts,
  getRecommendations,
} from "../../api/products";

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [popular, setPopular] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [feat, newItems, pop, rec, cats] = await Promise.all([
          getFeaturedProducts(),
          getNewArrivals(),
          getPopularProducts(),
          getRecommendations(),
          getAllCategories(),
        ]);
        setFeatured(feat);
        setNewArrivals(newItems);
        setPopular(pop);
        setRecommended(rec);
        setCategories(cats);
      } catch (error) {
        console.error("Failed to load home data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-indigo-600">
        <Zap className="animate-bounce" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-700 to-violet-700 text-white py-20 relative overflow-hidden">
        {/* ... (Hero content unchanged) ... */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center relative z-10">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block border border-white/30">
              Future Ready
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
              Next Gen <br /> Tech is Here.
            </h1>
            <p className="text-xl text-indigo-100 mb-8 max-w-lg leading-relaxed">
              Upgrade your setup with the latest processors, crystal clear
              displays, and immersive audio.
            </p>
            <div className="flex gap-4">
              <Link
                to="/shop"
                className="bg-white text-indigo-700 px-8 py-3.5 rounded-full font-bold hover:bg-gray-100 shadow-lg shadow-indigo-900/20 transition flex items-center gap-2"
              >
                Shop Now <ArrowRight size={18} />
              </Link>
              <Link
                to="/shop"
                className="px-8 py-3.5 rounded-full font-bold hover:bg-white/10 transition border border-white/30"
              >
                View Deals
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center relative">
            <div className="w-72 h-72 md:w-96 md:h-96 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-2xl relative z-10">
              <Laptop
                size={120}
                className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                strokeWidth={1}
              />
            </div>
            {/* Decorative Elements */}
            <div className="absolute top-0 right-10 bg-orange-500 w-20 h-20 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute bottom-0 left-10 bg-blue-500 w-32 h-32 rounded-full blur-3xl opacity-50"></div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="container mx-auto px-4 -mt-16 relative z-20 pb-12">
        <div className="mb-12">
          <CategoryCarousel categories={categories} />
        </div>

        <ProductCarousel title="Fresh Arrivals" products={newArrivals} />
        <BrandCarousel />
        <ProductCarousel title="Best Sellers in Tech" products={popular} />
        <ProductCarousel title="Recommended for You" products={recommended} />

        {/* Promo Banner */}
        <div className="my-16 bg-gray-900 rounded-3xl overflow-hidden relative text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-indigo-900/80 to-transparent skew-x-12 translate-x-20"></div>
          <div className="p-12 md:p-20 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <span className="text-orange-400 font-bold tracking-widest uppercase text-sm mb-2 block">
                Gaming Week
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                Level Up Your Setup
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Save up to 40% on gaming laptops, consoles, and high-performance
                peripherals.
              </p>
              <Link
                to="/shop"
                className="bg-orange-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-orange-600 transition inline-flex items-center gap-2 shadow-lg shadow-orange-900/20"
              >
                Browse Gaming Gear <Gamepad size={20} />
              </Link>
            </div>
            <div className="hidden md:block">
              <Gamepad
                size={200}
                strokeWidth={0.5}
                className="text-white/10 rotate-12"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
