import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Trash2, Star } from "lucide-react";
import {
  fetchWishlist,
  toggleWishlist,
  selectWishlistItems,
  selectWishlistLoading,
} from "../../store/wishlist/wishlistSlice";
import { formatCurrency } from "../../utils/currency";
import { useCart } from "../../context/CartContext";
import toast from "react-hot-toast";

const Wishlist = () => {
  const dispatch = useDispatch();
  const items = useSelector(selectWishlistItems);
  const loading = useSelector(selectWishlistLoading);
  const { addToCart } = useCart();

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const handleRemove = (productId) => {
    dispatch(toggleWishlist(productId));
  };

  const handleAddToCart = (product) => {
    const offer = product.offers?.[0];
    const price = offer?.price || product.price;
    addToCart({ ...product, price });
    toast.success(`${product.name} added to cart!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-indigo-600 font-medium">
        Loading your wishlist...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Heart size={24} className="text-red-500 fill-red-500" />
        <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
        {items.length > 0 && (
          <span className="ml-auto text-sm text-gray-500 font-medium">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Heart size={56} className="text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">
            Your wishlist is empty
          </h3>
          <p className="text-gray-500 mb-6">
            Save items you love and come back to them anytime.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-indigo-700 transition-colors"
          >
            <ShoppingBag size={18} />
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item) => {
            const product = item.product || item.Product;
            if (!product) return null;

            const thumbnail =
              product.media?.[0]?.url ||
              "https://placehold.co/400?text=No+Image";
            const price = product.minOfferPrice || product.price;

            return (
              <div
                key={item.id}
                className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group"
              >
                {/* Product Image */}
                <div className="relative">
                  <Link
                    to={`/product/${product.slug}`}
                    className="relative aspect-square bg-gray-50 p-3 flex items-center justify-center overflow-hidden block"
                  >
                    <img
                      src={thumbnail}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(product.id)}
                    className="cursor-pointer absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-red-500 hover:shadow transition-all"
                    title="Remove from wishlist"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Product Info */}
                <div className="p-3 flex flex-col flex-1">
                  <p className="text-[10px] text-gray-500 mb-0.5 truncate">
                    {product.brand?.name}
                  </p>
                  <Link
                    to={`/product/${product.slug}`}
                    className="font-semibold text-gray-900 text-sm leading-tight mb-2 hover:text-indigo-600 line-clamp-2"
                  >
                    {product.name}
                  </Link>

                  {/* Rating */}
                  {product.averageRating > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <Star
                        size={10}
                        className="text-yellow-400 fill-current"
                      />
                      <span className="text-[10px] font-medium text-gray-600">
                        {Number(product.averageRating).toFixed(1)}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        ({product.reviewCount || 0})
                      </span>
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-1">
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(price)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="cursor-pointer flex items-center gap-1 bg-indigo-600 text-white text-xs px-2 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      <ShoppingBag size={11} />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
