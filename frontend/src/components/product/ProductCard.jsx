import React from "react";
import { formatCurrency } from "../../utils/currency";
import { Link } from "react-router-dom";
import { ShoppingCart, Star, Plus, Minus } from "lucide-react";
import { useCart } from "../../context/CartContext";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault(); // Prevent navigating to product page
    const effectivePrice = Number(product.minOfferPrice) || Number(product.price) || 0;
    addToCart({ ...product, price: effectivePrice });
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full flex flex-col"
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-gray-50 p-4 flex items-center justify-center overflow-hidden">
        <img
          src={product.media?.[0]?.url || "https://placehold.co/400?text=No+Image"}
          alt={product.name}
          className="w-full h-full object-contain mix-blend-multiply "
        />

        {/* Badges */}
        {product.isNew && (
          <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            New
          </span>
        )}
        
        {(!product.inStock && product.totalOfferStock <= 0) && (
             <span className="absolute top-2 right-2 bg-gray-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                Out of Stock
             </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="text-xs text-gray-500 mb-1">
          {typeof product.category === "object"
            ? product.category?.name
            : product.category}
        </div>
        <h3 className="font-bold text-gray-900 leading-tight mb-2 group-hover:text-indigo-600 line-clamp-2">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <Star size={12} className="text-yellow-400 fill-current" />
          <span className="text-xs font-medium text-gray-600">
            {Number(product.averageRating || 0).toFixed(1)}
          </span>
          <span className="text-xs text-gray-400">({product.reviewCount || 0})</span>
        </div>

        {/* Price & Action */}
        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                 <span className={`text-lg font-bold ${product.totalOfferStock > 0 || product.inStock ? "text-gray-900" : "text-gray-400"}`}>
                  {formatCurrency(Number(product.minOfferPrice) || Number(product.price) || 0)}
                </span>
                {product.totalOfferStock > 0 && Number(product.minOfferPrice) > 0 && Number(product.minOfferPrice) < Number(product.price) && (
                    <span className="text-xs text-red-600 font-bold">
                        -{Math.round(((Number(product.price) - Number(product.minOfferPrice)) / Number(product.price)) * 100)}%
                    </span>
                )}
              </div>
              
              {product.totalOfferStock > 0 && Number(product.minOfferPrice) > 0 && Number(product.minOfferPrice) < Number(product.price) && (
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                      <span>M.R.P.:</span>
                      <span className="relative inline-block text-gray-500">
                            {formatCurrency(Number(product.price))}
                            <span className="absolute left-0 top-1/2 w-full h-[1px] bg-gray-500 -translate-y-1/2"></span>
                      </span>
                  </div>
              )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.inStock && product.totalOfferStock <= 0}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors mb-1 ${
                product.totalOfferStock > 0 || product.inStock
                ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
             title={product.totalOfferStock > 0 ? "Add to Cart" : "Out of Stock"}
          >
            {product.totalOfferStock > 0 || product.inStock ? <Plus size={18} /> : <Minus size={18} />}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
