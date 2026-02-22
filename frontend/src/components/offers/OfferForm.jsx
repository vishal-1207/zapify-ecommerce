import React, { useState } from "react";
import { formatCurrency, CURRENCY_SYMBOL } from "../../utils/currency";
import { Loader2, CheckCircle, Tag, Package, AlertCircle } from "lucide-react";

const OfferForm = ({ product, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    price: "",
    stockQuantity: "",
    condition: "New",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      productId: product.objectID || product.id,
    });
  };

  return (
    <div className="space-y-6">
      {/* Product Summary */}
      <div className="bg-gray-50 p-4 rounded-lg flex gap-4 items-start border border-gray-100">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-16 h-16 object-cover rounded-md border"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
            <Package size={24} />
          </div>
        )}
        <div>
          <h4 className="font-semibold text-gray-900 line-clamp-1">
            {product.name}
          </h4>
          <div className="text-sm text-gray-500 mt-1 flex gap-3">
            <span>Brand: {product.brand || "Generic"}</span>
            <span>
              ID: {product.objectID?.slice(0, 8) || product.id?.slice(0, 8)}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Price ({CURRENCY_SYMBOL}){" "}
            <span className="text-red-500">*</span>
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">
                {CURRENCY_SYMBOL}
              </span>
            </div>
            <input
              type="number"
              name="price"
              step="0.01"
              required
              min="0"
              value={formData.price}
              onChange={handleChange}
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2 border"
              placeholder="0.00"
            />
          </div>
          {product.price > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              Lowest Offer:{" "}
              <span className="font-medium text-green-600">
                {formatCurrency(product.price)}
              </span>
            </p>
          )}
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="stockQuantity"
            required
            min="0"
            value={formData.stockQuantity}
            onChange={handleChange}
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full px-4 sm:text-sm border-gray-300 rounded-md py-2 border"
            placeholder="Available units"
          />
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Condition <span className="text-red-500">*</span>
          </label>
          <select
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border bg-white"
          >
            <option value="New">New</option>
            <option value="Used - Like New">Used - Like New</option>
            <option value="Used - Good">Used - Good</option>
            <option value="Refurbished">Refurbished</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                List Offer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OfferForm;
