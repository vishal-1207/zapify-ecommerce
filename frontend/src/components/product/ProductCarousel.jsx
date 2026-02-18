import React from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";

const ProductCarousel = ({ title, products, link = "/shop" }) => {
  if (!products || products.length === 0) return null;

  return (
    <div className="py-8 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">
          {title}
        </h2>
        <Link
          to={link}
          className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1"
        >
          See all <ArrowRight size={14} />
        </Link>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 snap-x">
        {products.map((product) => (
          <div
            key={product.id}
            className="min-w-45 md:min-w-55 max-w-55 snap-start"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductCarousel;
