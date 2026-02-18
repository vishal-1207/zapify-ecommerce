import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { getAllProducts } from "../../api/products";
import axios from "../../api/axios";
import ProductCard from "../../components/product/ProductCard";
import Pagination from "../../components/common/Pagination";
import { Store, Search, ArrowUpDown } from "lucide-react";

const BrandStore = () => {
    const { slug } = useParams();
    const [brand, setBrand] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Local State for Search/Sort/Pagination within the Brand Store
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState("newest");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12;

    useEffect(() => {
        const fetchBrandData = async () => {
            setLoading(true);
            try {
                // Fetch Brand Details by Slug
                const brandRes = await axios.get(`/brand/${slug}`);
                setBrand(brandRes.data.brand);
                
                // Fetch Brand Products
                if (brandRes.data.brand?.id) {
                     const productsData = await getAllProducts({ brandId: brandRes.data.brand.id, limit: 1000 }); // Fetch all to paginate locally
                     setProducts(productsData || []); // Fix: Use returned array directly
                }
            } catch (error) {
                console.error("Failed to load brand store", error);
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchBrandData();
        }
    }, [slug]);

    // Derived State: Filter & Sort & Paginate
    const processedProducts = useMemo(() => {
        let result = [...products];

        // 1. Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(q) || p.model?.toLowerCase().includes(q));
        }

        // 2. Sort
        switch (sortOption) {
            case "price-asc":
                result.sort((a, b) => (Number(a.minOfferPrice) || Number(a.price)) - (Number(b.minOfferPrice) || Number(b.price)));
                break;
            case "price-desc":
                result.sort((a, b) => (Number(b.minOfferPrice) || Number(b.price)) - (Number(a.minOfferPrice) || Number(a.price)));
                break;
            case "rating":
                result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
                break;
            case "newest":
            default:
                result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }

        return result;
    }, [products, searchQuery, sortOption]);

    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return processedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [processedProducts, currentPage]);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortOption]);


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!brand) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                <Store size={64} className="text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900">Store Not Found</h2>
                <p className="text-gray-500 mt-2">The brand you are looking for does not exist.</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            {/* Hero Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="relative h-48 md:h-64 bg-gradient-to-r from-gray-900 to-gray-800 overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                     {/* Decorative Circles */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white opacity-5 mix-blend-overlay blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 rounded-full bg-indigo-500 opacity-10 mix-blend-overlay blur-2xl"></div>

                    <div className="container mx-auto px-4 h-full flex items-end pb-8 relative z-10">
                         {/* Brand Logo & Info Overlay */}
                        <div className="flex flex-col md:flex-row items-end md:items-end gap-6 w-full">
                            <div className="w-28 h-28 md:w-32 md:h-32 bg-white rounded-2xl shadow-lg p-2 flex items-center justify-center -mb-12 md:-mb-14 border border-gray-100">
                                {brand.media ? (
                                    <img src={brand.media.url} alt={brand.name} className="w-full h-full object-contain" />
                                ) : (
                                    <Store size={48} className="text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1 text-white mb-1 md:mb-0">
                                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-2">{brand.name}</h1>
                                {/* <p className="text-gray-300 text-sm md:text-base max-w-2xl line-clamp-1">{brand.description}</p> */}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description & Stats Bar */}
                <div className="container mx-auto px-4 pt-16 md:pt-20 pb-6">
                     <p className="text-gray-600 max-w-4xl text-lg leading-relaxed">{brand.description}</p>
                </div>
            </div>

            {/* Toolbar */}
             <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                     <h2 className="text-2xl font-bold text-gray-900">
                        Products <span className="text-gray-400 font-normal text-lg ml-2">({processedProducts.length})</span>
                    </h2>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search Brand Products */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder={`Search ${brand.name}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
                            />
                        </div>

                         {/* Sort Dropdown */}
                         <div className="relative">
                             <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                             <select 
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white w-full sm:w-auto cursor-pointer"
                             >
                                 <option value="newest">Newest Arrivals</option>
                                 <option value="price-asc">Price: Low to High</option>
                                 <option value="price-desc">Price: High to Low</option>
                                 <option value="rating">Top Rated</option>
                             </select>
                         </div>
                    </div>
                </div>

                {/* Product Grid */}
                {processedProducts.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <Store size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                        <p className="text-gray-500">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {paginatedProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {/* Pagination */}
                        <Pagination 
                            currentPage={currentPage}
                            totalItems={processedProducts.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default BrandStore;
