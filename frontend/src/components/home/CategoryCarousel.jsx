import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * A simple reusable carousel component for categories.
 * Uses native scrolling with hidden scrollbar for smooth feel.
 */
const CategoryCarousel = ({ categories = [] }) => {
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

  if (!categories || categories.length === 0) return null;

  return (
    <div className="relative group">
      {/* Left Arrow */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-sm text-gray-700 hover:text-indigo-600 hover:scale-110 transition opacity-0 group-hover:opacity-100 disabled:opacity-0 cursor-pointer border border-gray-100"
        aria-label="Scroll left"
      >
        <ChevronLeft size={24} />
      </button>

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-8 pt-4 px-4 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((cat) => {
          return (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="min-w-[260px] md:min-w-[280px] bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition duration-300 group/card snap-start flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-6">
                <h3
                  className="text-xl font-bold text-gray-800 line-clamp-1"
                  title={cat.name}
                >
                  {cat.name}
                </h3>
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover/card:bg-indigo-600 group-hover/card:text-white transition-colors duration-300 shadow-sm w-16 h-16 flex items-center justify-center overflow-hidden">
                  {cat.media && cat.media.url ? (
                    <img
                      src={cat.media.url}
                      alt="IMG"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-xs text-indigo-400 font-bold">
                      IMG
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  Discover the best in {cat.name}.
                </p>
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm group-hover/card:gap-3 transition-all">
                  Shop Now <ArrowIcon />
                </div>
              </div>
            </Link>
          );
        })}
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

const ArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export default CategoryCarousel;
