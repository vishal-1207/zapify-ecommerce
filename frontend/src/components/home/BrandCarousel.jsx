import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const brands = [
  { id: 1, name: "Apple", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" },
  { id: 2, name: "Samsung", logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg" },
  { id: 3, name: "Sony", logo: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Sony_logo_%28white%29.svg" }, // Usually white, might need care with background
  { id: 4, name: "Dell", logo: "https://upload.wikimedia.org/wikipedia/commons/4/48/Dell_Logo.svg" },
  { id: 5, name: "HP", logo: "https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg" },
  { id: 6, name: "Logitech", logo: "https://upload.wikimedia.org/wikipedia/commons/1/17/Logitech_logo.svg" },
  { id: 7, name: "Asus", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2e/ASUS_Logo.svg" },
  { id: 8, name: "Microsoft", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" },
  { id: 9, name: "Lenovo", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Lenovo_logo_2015.svg" },
  { id: 10, name: "Canon", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Canon_logo.svg" },
];

const BrandCarousel = () => {
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

  return (
    <div className="relative group my-12">
        <div className="flex justify-between items-center mb-6 px-4">
            <h2 className="text-2xl font-bold text-gray-800">Shop by Brand</h2>
        </div>
      
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
        className="flex gap-8 overflow-x-auto pb-8 pt-4 px-4 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {brands.map((brand) => (
          <Link
            key={brand.id}
            to={`/shop?brand=${brand.name}`}
            className="flex flex-col items-center gap-3 min-w-[100px] snap-start group/brand"
          >
            <div className="w-24 h-24 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center p-5 hover:shadow-md hover:scale-105 transition-all duration-300 group-hover/brand:border-indigo-100">
               <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain filter grayscale group-hover/brand:grayscale-0 transition-all duration-300" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover/brand:text-indigo-600 transition-colors">
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
