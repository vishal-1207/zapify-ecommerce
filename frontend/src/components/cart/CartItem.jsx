import { formatCurrency } from "../../utils/currency";
import { Trash2, Plus, Minus } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { Link } from "react-router-dom";

const CartItem = ({ item }) => {
  const { updateQty, removeFromCart } = useCart();

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
      {/* Image */}
      <Link
        to={`/product/${item.slug}`}
        className="w-24 h-24 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden p-2"
      >
        <img
          src={
            item.media?.[0]?.url ||
            item.image ||
            "https://placehold.co/400?text=No+Image"
          }
          alt={item.name}
          className="w-full h-full object-contain mix-blend-multiply"
        />
      </Link>

      {/* Details */}
      <div className="flex-grow text-center sm:text-left">
        <Link
          to={`/product/${item.slug}`}
          className="font-bold text-gray-900 hover:text-indigo-600 transition line-clamp-1"
        >
          {item.name}
        </Link>
        <p className="text-sm text-gray-500 mb-2">
          {item.category?.name || "Category"}
        </p>
        <div className="flex flex-col">
          <div className="font-bold text-indigo-600">
            {formatCurrency(Number(item.price || 0))}
          </div>

          {Number(item.price) < Number(item.originalPrice) && (
            <div className="text-xs text-gray-500">
              <span className="line-through mr-1">
                {formatCurrency(Number(item.originalPrice || 0))}
              </span>
              <span className="text-green-600 font-bold">
                {Math.round(
                  ((Number(item.originalPrice) - Number(item.price)) /
                    Number(item.originalPrice)) *
                    100,
                )}
                % off
              </span>
            </div>
          )}

          {item.isDealActive && (
            <div className="mt-1">
              <span className="text-xs text-red-600 font-bold bg-red-50 px-1 rounded border border-red-100">
                Lightning Deal
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-gray-200 rounded-lg">
          <button
            onClick={() => updateQty(item.offerId || item.id, -1)}
            disabled={item.qty <= 1}
            className="p-2 hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center font-medium text-gray-900">
            {item.qty}
          </span>
          <button
            onClick={() => updateQty(item.offerId || item.id, 1)}
            className="p-2 hover:bg-gray-50 text-gray-600 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Subtotal & Remove */}
      <div className="flex items-center gap-4 sm:ml-4">
        <div className="hidden sm:block font-bold text-gray-900 w-20 text-right">
          {formatCurrency((Number(item.price) || 0) * item.qty)}
        </div>

        {/* Remove Button */}
        <button
          onClick={() => removeFromCart(item.offerId || item.id)}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors ml-4"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default CartItem;
