import React, { useRef, useState, useEffect, useCallback } from "react";
import { formatCurrency } from "../../utils/currency";
import { liteClient as algoliasearch } from "algoliasearch/lite";
import {
  InstantSearch,
  Hits,
  Configure,
  useInstantSearch,
  useSearchBox,
} from "react-instantsearch";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search as SearchIcon, X, ChevronDown } from "lucide-react";
import { debounce } from "lodash"; 

// Initialize Algolia client
const searchClient = algoliasearch(
  import.meta.env.VITE_ALGOLIA_APP_ID,
  import.meta.env.VITE_ALGOLIA_SEARCH_KEY
);

const Hit = ({ hit, onClick }) => {
  return (
    <div
      onClick={() => onClick(hit.slug || hit.objectID)}
      className="flex items-start gap-3 p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
    >
      <div className="w-10 h-10 flex-shrink-0 bg-white rounded border border-gray-200 p-1 flex items-center justify-center">
        <img
          src={hit.image}
          alt={hit.name}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            e.target.src = "https://placehold.co/100?text=No+Image";
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
          {hit.name}
        </h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500">
            in {hit.category}
          </span>
          {hit.price && (
               <span className="text-xs text-red-700 font-bold">
                 {formatCurrency(hit.price)}
               </span>
          )}
        </div>
      </div>
    </div>
  );
};

const CustomSearchBox = ({ isActive, setIsActive, onClose }) => {
  const { refine } = useSearchBox();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync internal state with URL on mount
  useEffect(() => {
    const urlQuery = searchParams.get("search");
    if (urlQuery) {
        setQuery(urlQuery);
        refine(urlQuery);
    }
  }, [searchParams, refine]);

  // Debounced URL update
  const updateUrl = useCallback(
    debounce((newQuery) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        if (newQuery) {
            newParams.set("search", newQuery);
        } else {
            newParams.delete("search");
        }
        return newParams;
      }, { replace: true });
    }, 500),
    []
  );

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    refine(value);
    
    // Update URL as user types (debounced)
    // Only if we are already on the shop page? 
    // User asked "url path should update as well as i type"
    // Usually this is only desirable if we are on the search results page.
    // If on home page, typing updates URL to /shop?search=... immediately? That might be jarring.
    // But let's assume if on Shop page, update URL.
    if (window.location.pathname === '/shop') {
        updateUrl(value);
    }

    if (value.length > 0) {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      const params = new URLSearchParams();
      params.set("search", query);
      if (category !== "All") {
        params.set("category", category);
      }
      navigate(`/shop?${params.toString()}`);
      setIsActive(false);
      if (onClose) onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSubmit(e);
    }
  };

  // Mock categories for dropdown (or fetch if needed)
  const categories = ["All", "Smartphones", "Laptops", "Audio", "Cameras", "Accessories"];

  return (
    <div className="flex w-full h-10 rounded-md shadow-sm bg-white overflow-hidden border-2 border-transparent focus-within:border-orange-400 transition-colors">
       {/* Category Dropdown */}
       <div className="relative bg-gray-100 border-r border-gray-300 hover:bg-gray-200 transition-colors">
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="appearance-none bg-transparent pl-3 pr-8 h-full text-xs text-gray-600 font-medium focus:outline-none cursor-pointer"
          >
             {categories.map(cat => (
                 <option key={cat} value={cat}>{cat}</option>
             ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
       </div>

       {/* Input */}
       <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleSearch}
          onKeyDown={handleKeyDown}
          onFocus={() => { if(query.length > 0) setIsActive(true); }}
          placeholder="Search Zapify"
          className="flex-1 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none"
       />
       {query && (
           <button onClick={() => {setQuery(''); refine(''); setIsActive(false); inputRef.current?.focus();}} className="pr-2 text-gray-400 hover:text-gray-600">
               <X size={16} />
           </button>
       )}

       {/* Search Button */}
       <button 
          onClick={onSubmit}
          className="bg-orange-400 hover:bg-orange-500 text-gray-900 px-4 flex items-center justify-center transition-colors"
       >
          <SearchIcon size={20} />
       </button>
    </div>
  );
};

const SearchComponent = () => {
  const [isActive, setIsActive] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking inside the search component
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProductClick = (productSlug) => {
    navigate(`/product/${productSlug}`);
    setIsActive(false);
  };

  return (
    <div ref={searchRef} className="relative w-full z-[1000]">
      <InstantSearch searchClient={searchClient} indexName="products">
        <Configure hitsPerPage={6} />
        <CustomSearchBox
          isActive={isActive}
          setIsActive={setIsActive}
          onClose={() => setIsActive(false)}
        />
        
        {isActive && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-b-md shadow-lg border border-gray-200 overflow-hidden max-h-[500px] overflow-y-auto z-[1001]">
             <div className="p-0">
                <Hits
                  hitComponent={({ hit }) => (
                    <Hit hit={hit} onClick={handleProductClick} />
                  )}
                  classNames={{
                    list: "flex flex-col",
                    item: "block",
                  }}
                />
             </div>
          </div>
        )}
      </InstantSearch>
    </div>
  );
};

export default SearchComponent;
