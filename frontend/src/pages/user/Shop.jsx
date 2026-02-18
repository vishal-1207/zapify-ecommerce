import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Filter,
  ChevronDown,
  Check,
  Star,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { getAllProducts } from "../../api/products";
import { getAllCategories } from "../../api/categories";
import { getAllBrands } from "../../api/brands";
import ProductCard from "../../components/product/ProductCard";
import { formatCurrency } from "../../utils/currency";

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Initialize filters from URL or defaults
  // URL contains SLUGS now
  const selectedCategorySlugs = useMemo(() => searchParams.getAll("category").filter(Boolean) || [], [searchParams]);
  const selectedBrandSlugs = useMemo(() => searchParams.getAll("brand").filter(Boolean) || [], [searchParams]);

  const [priceRange, setPriceRange] = useState(() => ({
    min: Number(searchParams.get("minPrice")) || 0,
    max: Number(searchParams.get("maxPrice")) || 3000,
  }));
  const [minRating, setMinRating] = useState(() => {
    return Number(searchParams.get("minRating")) || 0;
  });
  const [sortBy, setSortBy] = useState(() => {
    return searchParams.get("sort") || "featured";
  });

  // Fetch Data (Once on Mount)
  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        const [productsData, categoriesData, brandsData] = await Promise.all([
          getAllProducts({ limit: 1000 }), // Fetch more products for client-side filtering
          getAllCategories(),
          getAllBrands(),
        ]);
        setProducts(productsData || []); // getAllProducts returns the array directly
        setCategories(categoriesData);
        setBrands(brandsData);
      } catch (error) {
        console.error("Failed to load shop data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []); // Run once

  // No longer deriving brands from products, using full list from API
  // This fixes the "brands disappeared" issue when products list is computed or empty
  // and allows "unidentified filter" lookup to work even if no products match.

  // Sync Filters to URL
  const updateFilters = (newCategorySlugs, newBrandSlugs, newPrice, newRating, newSort) => {
     const newParams = new URLSearchParams();
     
     const currentSearch = searchParams.get("search");
     if (currentSearch) newParams.set("search", currentSearch);

     (newCategorySlugs || selectedCategorySlugs).forEach(c => newParams.append("category", c));
     (newBrandSlugs || selectedBrandSlugs).forEach(b => newParams.append("brand", b));
     
     const pRange = newPrice || priceRange;
     if (pRange.min > 0) newParams.set("minPrice", pRange.min);
     if (pRange.max < 3000) newParams.set("maxPrice", pRange.max);
     
     const rating = newRating !== undefined ? newRating : minRating;
     if (rating > 0) newParams.set("minRating", rating);
     
     const sort = newSort || sortBy;
     if (sort !== "featured") newParams.set("sort", sort);

     setSearchParams(newParams, { replace: true });
  };
  
  // Handlers wrapper to update URL directly
  // We no longer use local state for selections, we drive from URL.
  // Wait, local state for slider/rating? 
  // We can drive everything from URL or keep local sync.
  // Previous implement used local state 'selectedCategories' then sync effect.
  // Direct URL update is cleaner for "update as I type/click".
  
  const toggleCategory = (slug) => {
      const current = selectedCategorySlugs;
      const newSlugs = current.includes(slug) 
        ? current.filter(s => s !== slug) 
        : [...current, slug];
      updateFilters(newSlugs, null, null, undefined, null);
  };

  const toggleBrand = (slug) => {
      const current = selectedBrandSlugs;
      const newSlugs = current.includes(slug)
        ? current.filter(s => s !== slug)
        : [...current, slug];
      updateFilters(null, newSlugs, null, undefined, null);
  };

  const handlePriceChange = (newRange) => {
      setPriceRange(newRange); // Optimistic UI
      // Debounce this? Or just update. Slider usually needs debounce.
      // For now, let's update URL on mouseUp or just let it update.
      // If we update URL on every slide it might be laggy. 
      // We will update URL only when interaction ends ideally, 
      // but standard input onChange is continuous.
  };
  
  // Effect to update URL for price/rating/sort when state changes
  useEffect(() => {
     // Prevent infinite loop by checking if values actually changed? 
     // The 'updateFilters' recreates params.
     // We should only trigger this if we want to sync these specific states.
     // Simplified: We can just use updateFilters in the setters.
  }, []); 

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    const searchQuery = searchParams.get("search")?.toLowerCase() || "";

    return products
      .filter((product) => {
        // Search Filter
        if (searchQuery) {
            const matchesName = product.name?.toLowerCase().includes(searchQuery);
            const matchesModel = product.model?.toLowerCase().includes(searchQuery);
            const matchesBrand = typeof product.brand === 'object' 
                ? product.brand?.name?.toLowerCase().includes(searchQuery)
                : String(product.brand).toLowerCase().includes(searchQuery);
            const matchesCategory = typeof product.category === 'object'
                ? product.category?.name?.toLowerCase().includes(searchQuery)
                : String(product.category).toLowerCase().includes(searchQuery);

            if (!matchesName && !matchesModel && !matchesBrand && !matchesCategory) {
                return false;
            }
        }

        // Category Filter (Using Slugs)
        if (selectedCategorySlugs.length > 0) {
           const productCatSlug = typeof product.category === 'object' ? product.category?.slug : null;
           // Also verify ID fallback if slug missing?
           // If backend works, slug should be there.
           if (!productCatSlug || !selectedCategorySlugs.includes(productCatSlug)) {
               // Fallback: Check if we have ID in url (legacy support?) No, user asked for slug.
               return false;
           }
        }

        // Brand Filter (Using Slugs)
        if (selectedBrandSlugs.length > 0) {
             const productBrandSlug = typeof product.brand === 'object' ? product.brand?.slug : null;
             if (!productBrandSlug || !selectedBrandSlugs.includes(productBrandSlug)) {
                 return false;
             }
        }

        // Price Filter
        const min = priceRange.min;
        const max = priceRange.max;
        const price = Number(product.minOfferPrice) || Number(product.price) || 0; 
        if (price < min || price > max) return false;

        // Rating Filter
        if ((product.averageRating || 0) < minRating) return false;

        return true;
      })
      .sort((a, b) => {
        const priceA = Number(a.minOfferPrice) || Number(a.price) || 0;
        const priceB = Number(b.minOfferPrice) || Number(b.price) || 0;

        switch (sortBy) {
          case "priceLow":
            return priceA - priceB;
          case "priceHigh":
            return priceB - priceA;
          case "rating":
            return (b.averageRating || 0) - (a.averageRating || 0);
          default:
            // Default "Featured" Sort:
            // "Ascending order as per number of orders and rating"
            // Interpreted as: Higher ReviewCount/Rating comes first (Descending popularity)
            // Combined Score = (Rating * 20) + ReviewCount
            const scoreA = ((a.averageRating || 0) * 20) + (a.reviewCount || 0);
            const scoreB = ((b.averageRating || 0) * 20) + (b.reviewCount || 0);
            return scoreB - scoreA;
        }
      });
  }, [
    products,
    selectedCategorySlugs,
    selectedBrandSlugs,
    priceRange,
    minRating,
    sortBy,
    searchParams 
  ]);

  const clearAllFilters = () => {
    setSearchParams({}); // Clear all
    setPriceRange({ min: 0, max: 3000 });
    setMinRating(0);
    setSortBy("featured");
  };

  // Price Slider Helpers
  const MIN_PRICE_LIMIT = 0;
  const MAX_PRICE_LIMIT = 3000;
  const PRICE_GAP = 100;

  const handleMinPriceChange = (e) => {
    const value = Math.min(Number(e.target.value), priceRange.max - PRICE_GAP);
    const newRange = { ...priceRange, min: value };
    setPriceRange(newRange);
  };
  
  const handleMinPriceCommit = () => {
      updateFilters(null, null, priceRange, undefined, null);
  };

  const handleMaxPriceChange = (e) => {
    const value = Math.max(Number(e.target.value), priceRange.min + PRICE_GAP);
    const newRange = { ...priceRange, max: value };
    setPriceRange(newRange);
  };

  const handleMaxPriceCommit = () => {
       updateFilters(null, null, priceRange, undefined, null);
  };


  const getPercent = (value) =>
    Math.round(
      ((value - MIN_PRICE_LIMIT) / (MAX_PRICE_LIMIT - MIN_PRICE_LIMIT)) * 100,
    );

  // Prevent body scroll when mobile filter is open
  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileFilterOpen]);

  return (
    <div className="bg-gray-50 min-h-screen pt-4 pb-12">
      {/* Custom Styles for Range Slider */}
      <style>{`
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          border: 2px solid #4f46e5;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .range-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          border: 2px solid #4f46e5;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
      `}</style>

      <div className="container mx-auto px-4">
        {/* Top Bar: Title & Sort */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Shop</h1>
            <p className="text-xs text-gray-500">
              <span className="font-bold text-gray-900">
                {filteredProducts.length}
              </span>{" "}
              results
            </p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex-1 flex items-center justify-center gap-2 bg-gray-100 border border-transparent px-4 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <Filter size={16} /> Filters
            </button>

            {/* Sort Dropdown */}
            <div className="relative group flex-1 md:flex-none">
              <div className="absolute right-3 top-2.5 pointer-events-none text-gray-500">
                <ChevronDown size={14} />
              </div>
              <select
                value={sortBy}
                onChange={(e) => {
                    const val = e.target.value;
                    setSortBy(val);
                    updateFilters(null, null, null, undefined, val);
                }}
                className="appearance-none w-full md:w-48 bg-gray-50 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium outline-none focus:border-indigo-500 cursor-pointer hover:bg-white transition-colors"
              >
                <option value="featured">Sort: Featured</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="rating">Avg. Rating</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 relative">
          {/* Mobile Overlay (Backdrop) */}
          {isMobileFilterOpen && (
            <div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileFilterOpen(false)}
            />
          )}

          {/* Sidebar Filters */}
          <div
            className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-white p-6 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto
            lg:translate-x-0 lg:sticky lg:top-24 lg:z-0 lg:w-60 lg:xl:w-64 lg:p-0 lg:shadow-none lg:bg-transparent lg:h-[calc(100vh-8rem)] scrollbar-hide
            ${isMobileFilterOpen ? "translate-x-0" : "-translate-x-full"}
          `}
          >
            <div className="lg:hidden flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Filters</h2>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6 pb-20 lg:pb-0">
              {/* Active Filters Summary */}
              {(selectedCategorySlugs.length > 0 ||
                selectedBrandSlugs.length > 0 ||
                minRating > 0 ||
                priceRange.min > 0 ||
                priceRange.max < 3000) && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-gray-900 uppercase">
                      Active
                    </span>
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-red-600 hover:underline font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategorySlugs.map((slug) => {
                      const cat = categories.find(c => c.slug === slug);
                      return (
                        <span
                          key={slug}
                          className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1 font-medium"
                        >
                          {cat ? cat.name : slug} 
                          <X
                            size={10}
                            className="cursor-pointer"
                            onClick={() => toggleCategory(slug)}
                          />
                        </span>
                      );
                    })}
                    {selectedBrandSlugs.map((slug) => {
                      const brand = brands.find(b => b.slug === slug);
                      return (
                        <span
                          key={slug}
                          className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1 font-medium"
                        >
                          {brand ? brand.name : slug}
                          <X
                            size={10}
                            className="cursor-pointer"
                            onClick={() => toggleBrand(slug)}
                          />
                        </span>
                      );
                    })}
                    {(priceRange.min > 0 || priceRange.max < 3000) && (
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1 font-medium">
                        {formatCurrency(priceRange.min)} - {formatCurrency(priceRange.max)}{" "}
                        <X
                          size={10}
                          className="cursor-pointer"
                          onClick={() => {
                              const reset = { min: 0, max: 3000 };
                              setPriceRange(reset);
                              updateFilters(null, null, reset, undefined, null);
                          }}
                        />
                      </span>
                    )}
                    {minRating > 0 && (
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1 font-medium">
                        {minRating}+ Stars{" "}
                        <X
                          size={10}
                          className="cursor-pointer"
                          onClick={() => {
                              setMinRating(0);
                              updateFilters(null, null, null, 0, null);
                          }}
                        />
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Categories */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-indigo-600" />{" "}
                  Categories
                </h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2.5 cursor-pointer group"
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedCategorySlugs.includes(cat.slug) ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white group-hover:border-indigo-400"}`}
                      >
                        {selectedCategorySlugs.includes(cat.slug) && (
                          <Check size={10} className="text-white" />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={selectedCategorySlugs.includes(cat.slug)}
                        onChange={() => toggleCategory(cat.slug)}
                      />
                      <span
                        className={`text-xs ${selectedCategorySlugs.includes(cat.slug) ? "font-bold text-indigo-700" : "text-gray-600 group-hover:text-indigo-600"}`}
                      >
                        {cat.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Brands */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Brands</h3>
                <div className="space-y-2">
                  {brands.map((brand) => (
                    <label
                      key={brand.id}
                      className="flex items-center gap-2.5 cursor-pointer group"
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedBrandSlugs.includes(brand.slug) ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white group-hover:border-indigo-400"}`}
                      >
                        {selectedBrandSlugs.includes(brand.slug) && (
                          <Check size={10} className="text-white" />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={selectedBrandSlugs.includes(brand.slug)}
                        onChange={() => toggleBrand(brand.slug)}
                      />
                      <span
                        className={`text-xs ${selectedBrandSlugs.includes(brand.slug) ? "font-bold text-indigo-700" : "text-gray-600 group-hover:text-indigo-600"}`}
                      >
                        {brand.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Slider */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 text-sm">
                  Price Range
                </h3>
                <div className="relative w-full h-8 mb-4">
                  {/* Track Background */}
                  <div className="absolute top-1/2 left-0 w-full h-1.5 bg-gray-200 rounded-full -translate-y-1/2"></div>

                  {/* Active Range Track */}
                  <div
                    className="absolute top-1/2 h-1.5 bg-indigo-600 rounded-full -translate-y-1/2 pointer-events-none"
                    style={{
                      left: `${getPercent(priceRange.min)}%`,
                      width: `${getPercent(priceRange.max) - getPercent(priceRange.min)}%`,
                    }}
                  ></div>

                  {/* Min Range Input */}
                  <input
                    type="range"
                    min={MIN_PRICE_LIMIT}
                    max={MAX_PRICE_LIMIT}
                    step="10"
                    value={priceRange.min}
                    onChange={handleMinPriceChange}
                    onMouseUp={handleMinPriceCommit}
                    onTouchEnd={handleMinPriceCommit}
                    className={`range-slider absolute top-1/2 left-0 w-full -translate-y-1/2 appearance-none bg-transparent pointer-events-none 
                      [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
                      ${priceRange.min > MAX_PRICE_LIMIT - 100 ? "z-50" : "z-20"}
                    `}
                  />

                  {/* Max Range Input */}
                  <input
                    type="range"
                    min={MIN_PRICE_LIMIT}
                    max={MAX_PRICE_LIMIT}
                    step="10"
                    value={priceRange.max}
                    onChange={handleMaxPriceChange}
                    onMouseUp={handleMaxPriceCommit}
                    onTouchEnd={handleMaxPriceCommit}
                    className="range-slider absolute top-1/2 left-0 w-full -translate-y-1/2 appearance-none bg-transparent pointer-events-none z-30 
                      [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <div className="px-2 py-1 bg-gray-100 rounded border border-gray-200">
                    {formatCurrency(priceRange.min)}
                  </div>
                  <div className="px-2 py-1 bg-gray-100 rounded border border-gray-200">
                    {formatCurrency(priceRange.max)}
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">
                  Customer Rating
                </h3>
                <div className="space-y-1">
                  {[4, 3, 2, 1].map((stars) => (
                    <div
                      key={stars}
                      className={`flex items-center gap-2 cursor-pointer p-1.5 rounded-lg transition ${minRating === stars ? "bg-indigo-50" : "hover:bg-gray-50"}`}
                      onClick={() => {
                        const val = minRating === stars ? 0 : stars;
                        setMinRating(val);
                        updateFilters(null, null, null, val, null);
                      }}
                    >
                      <div className="flex text-yellow-400 gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < stars ? "currentColor" : "none"}
                            className={i >= stars ? "text-gray-300" : ""}
                          />
                        ))}
                      </div>
                      <span
                        className={`text-xs ${minRating === stars ? "font-bold text-indigo-900" : "text-gray-600"}`}
                      >
                        & Up
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Footer Actions */}
            <div className="lg:hidden absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex gap-4">
              <button
                onClick={clearAllFilters}
                className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200"
              >
                View Results
              </button>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="h-64 bg-gray-200 rounded-xl animate-pulse"
                  ></div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  No products found
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Try adjusting your filters or search criteria.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="text-indigo-600 font-bold hover:underline text-sm"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="h-full">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
