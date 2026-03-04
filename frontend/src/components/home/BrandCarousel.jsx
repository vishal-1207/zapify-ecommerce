import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const BrandCarousel = ({ brands = [] }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!brands || brands.length === 0) {
    return null;
  }

  return (
    <div className="relative group my-12">
      <div className="flex justify-between items-center mb-6 px-4">
        <h2 className="text-2xl font-bold text-gray-800">Shop by Brand</h2>
      </div>

      {/* Left Arrow */}
      {brands.length > 5 && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-sm text-gray-700 hover:text-indigo-600 hover:scale-110 transition opacity-0 group-hover:opacity-100 disabled:opacity-0 cursor-pointer border border-gray-100"
          aria-label="Scroll left"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        className="flex gap-8 overflow-x-auto pb-8 pt-4 px-4 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {brands.map((brand) => (
          <Link
            key={brand.id}
            to={`/shop?brand=${brand.slug}`}
            className="flex flex-col items-center gap-3 min-w-[100px] snap-start group/brand"
          >
            <div className="w-24 h-24 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center p-5 hover:shadow-md hover:scale-105 transition-all duration-300 group-hover/brand:border-indigo-100 overflow-hidden">
              {brand.media?.url ? (
                <img
                  src={brand.media.url}
                  alt={brand.name}
                  className="w-full h-full object-contain filter grayscale group-hover/brand:grayscale-0 transition-all duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl uppercase">
                  {brand.name.substring(0, 2)}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover/brand:text-indigo-600 transition-colors text-center w-full truncate px-1">
              {brand.name}
            </span>
          </Link>
        ))}
      </div>

      {/* Right Arrow */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg text-gray-700 hover:text-indigo-600 hover:scale-110 transition opacity-0 group-hover:opacity-100 disabled:opacity-0 cursor-pointer border border-gray-100"
        aria-label="Scroll right"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
};

export default BrandCarousel;
