import { useRef, useState, useEffect, useMemo } from "react";
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

const searchClient = algoliasearch(
  import.meta.env.ALGOLIA_APP_ID,
  import.meta.env.ALGOLIA_SEARCH_KEY,
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
          <span className="text-xs text-gray-500">in {hit.category}</span>
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

const CustomSearchBox = ({
  setIsActive,
  onClose,
  selectedCategorySlug,
  setSelectedCategorySlug,
}) => {
  const { refine } = useSearchBox();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    import("../../api/categories")
      .then((module) => module.getAllCategories())
      .then((data) => setCategories(data))
      .catch((error) =>
        console.error("Failed to fetch categories for SearchBox", error),
      );
  }, []);

  useEffect(() => {
    const urlQuery = searchParams.get("search");
    if (urlQuery) {
      setQuery(urlQuery);
      refine(urlQuery);
    }
  }, [searchParams, refine]);

  const updateUrl = useMemo(
    () =>
      debounce((newQuery) => {
        setSearchParams(
          (prev) => {
            const newParams = new URLSearchParams(prev);
            if (newQuery) {
              newParams.set("search", newQuery);
            } else {
              newParams.delete("search");
            }
            return newParams;
          },
          { replace: true },
        );
      }, 500),
    [setSearchParams],
  );

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    refine(value);

    if (window.location.pathname === "/shop") {
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
      if (selectedCategorySlug) {
        params.set("category", selectedCategorySlug);
      }
      navigate(`/shop?${params.toString()}`);
      setIsActive(false);
      if (onClose) onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSubmit(e);
    }
  };

  return (
    <div className="flex w-full h-10 rounded-md shadow-sm bg-white overflow-hidden border-2 border-transparent focus-within:border-orange-400 transition-colors">
      {/* Category Dropdown */}
      <div className="relative bg-gray-100 border-r border-gray-300 hover:bg-gray-200 transition-colors w-32 md:w-auto">
        <select
          value={selectedCategorySlug}
          onChange={(e) => setSelectedCategorySlug(e.target.value)}
          className="appearance-none bg-transparent pl-3 pr-8 w-full h-full text-xs text-gray-600 font-medium focus:outline-none cursor-pointer truncate"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleSearch}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (query.length > 0) setIsActive(true);
        }}
        placeholder="Search Zapify"
        className="flex-1 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none min-w-0"
      />
      {query && (
        <button
          onClick={() => {
            setQuery("");
            refine("");
            setIsActive(false);
            inputRef.current?.focus();
          }}
          className="pr-2 text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      )}

      {/* Search Button */}
      <button
        onClick={onSubmit}
        className="cursor-pointer bg-orange-400 hover:bg-orange-500 text-gray-900 px-4 flex items-center justify-center transition-colors"
      >
        <SearchIcon size={20} />
      </button>
    </div>
  );
};

const SearchResults = ({ onProductClick }) => {
  const { results } = useInstantSearch();

  if (results && results.nbHits === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 flex flex-col items-center justify-center border-t border-gray-100">
        <SearchIcon size={32} className="mb-3 text-gray-300" />
        <p className="font-bold text-gray-700 text-sm">No results found</p>
        <p className="text-xs mt-1 text-gray-500">
          Try adjusting your search or category filter
        </p>
      </div>
    );
  }

  return (
    <div className="p-0">
      <Hits
        hitComponent={({ hit }) => <Hit hit={hit} onClick={onProductClick} />}
        classNames={{
          list: "flex flex-col",
          item: "block",
        }}
      />
    </div>
  );
};

const SearchComponent = () => {
  const [isActive, setIsActive] = useState(false);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("");
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
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
        <Configure
          hitsPerPage={6}
          filters={
            selectedCategorySlug
              ? `category.slug:'${selectedCategorySlug}'`
              : ""
          }
        />
        <CustomSearchBox
          isActive={isActive}
          setIsActive={setIsActive}
          onClose={() => setIsActive(false)}
          selectedCategorySlug={selectedCategorySlug}
          setSelectedCategorySlug={setSelectedCategorySlug}
        />

        {isActive && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-b-md shadow-lg border border-gray-200 overflow-hidden max-h-[500px] overflow-y-auto z-[1001]">
            <SearchResults onProductClick={handleProductClick} />
          </div>
        )}
      </InstantSearch>
    </div>
  );
};

export default SearchComponent;
