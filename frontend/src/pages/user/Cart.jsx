import React from "react";
import { useCart } from "../../context/CartContext";
import CartItem from "../../components/cart/CartItem";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency } from "../../utils/currency";

const Cart = () => {
  const { cart, cartTotal, cartCount } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (isAuthenticated) {
      navigate("/checkout");
    } else {
      navigate("/login", { state: { from: "/checkout" } });
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={48} className="text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Your cart is empty
        </h2>
        <p className="text-gray-500 mb-8 max-w-sm">
          It looks like you haven't added anything to your cart yet.
        </p>
        <Link
          to="/shop"
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items List */}
        <div className="lg:w-2/3">
          <div className="border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <span className="font-bold text-gray-700">
                {cartCount} {cartCount === 1 ? "Item" : "Items"}
              </span>
            </div>
            <div className="p-6">
              {cart.map((item) => (
                <CartItem key={item.offerId || item.id} item={item} />
              ))}
            </div>
          </div>
            <Link to="/shop" className="inline-flex items-center gap-2 mt-6 text-indigo-600 font-bold hover:underline">
                <ArrowLeft size={18} /> Continue Shopping
            </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600 font-bold">Free</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax Estimate</span>
                <span>{formatCurrency(cartTotal * 0.08)}</span>
              </div>
              <div className="h-px bg-gray-100 my-4"></div>
              <div className="flex justify-between text-xl font-bold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(cartTotal * 1.08)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="block w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 mb-4 text-center"
            >
              Proceed to Checkout
            </button>
            <div className="flex justify-center gap-4 text-gray-400">
                 {/* Payment Icons Placeholder */}
                 <div className="w-8 h-5 bg-gray-100 rounded"></div>
                 <div className="w-8 h-5 bg-gray-100 rounded"></div>
                 <div className="w-8 h-5 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
