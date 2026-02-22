import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { createPaymentIntent } from "../../api/payment";
import { createOrder, getOrderDetails } from "../../api/orders";
import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../utils/currency";
import { toast } from "react-hot-toast";
import { ShieldCheck, CreditCard, Lock, Truck, MapPin } from "lucide-react";

// Replace with your actual publishable key or env var
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripeKey) {
  console.error("Stripe publishable key is missing in environment variables.");
}

const stripePromise = loadStripe(stripeKey);

const CheckoutForm = ({ order, clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setError(null);

    if (!stripe || !elements) return;

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: order.User?.fullname,
          email: order.User?.email,
          address: {
            line1: order.shippingAddress?.addressLine1,
            city: order.shippingAddress?.city,
            state: order.shippingAddress?.state,
            postal_code: order.shippingAddress?.pincode,
            country: "IN",
          },
        },
      },
    });

    if (result.error) {
      setError(result.error.message);
      setProcessing(false);
    } else {
      if (result.paymentIntent.status === "succeeded") {
        refreshCart(); // The backend already cleared the cart, we just need to sync the frontend badge
        navigate(`/order-success/${order.id}`);
      }
    }
  };

  const cardStyle = {
    style: {
      base: {
        color: "#32325d",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    },
    hidePostalCode: true,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="p-3 bg-white border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
          <CardElement options={cardStyle} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200 flex items-center gap-2">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
      >
        {processing ? (
          <>Processing...</>
        ) : (
          <>
            <Lock size={18} /> Pay {formatCurrency(order.totalAmount)}
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
        <ShieldCheck size={14} className="text-green-600" />
        <span>Payments are secure and encrypted.</span>
      </div>
    </form>
  );
};

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addressId } = location.state || {}; // Received from Checkout

  const [clientSecret, setClientSecret] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!addressId) {
      // If direct access or missing state, redirect
      navigate("/checkout");
      return;
    }
    initializePayment();
  }, [addressId]);

  const initializePayment = async () => {
    try {
      // 1. Create Order
      const newOrder = await createOrder(addressId);

      // 2. Fetch Full Order Details (to display summary)
      const orderDetails = await getOrderDetails(newOrder.id);
      setOrder(orderDetails);

      // 3. Create Payment Intent
      const paymentData = await createPaymentIntent(newOrder.id);
      setClientSecret(paymentData.clientSecret);
    } catch (error) {
      console.error(error);
      toast.error("Failed to initialize payment");
      navigate("/cart");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500 font-medium">
          Preparing your secure checkout...
        </p>
      </div>
    );

  if (!order || !clientSecret) return null;

  const appearance = { theme: "stripe" };
  const options = { clientSecret, appearance };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center sm:text-left">
          Complete Your Payment
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column: Order Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="text-indigo-600" size={24} /> Order Summary
              </h2>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {order.orderItems?.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 py-4 border-b border-gray-100 last:border-0"
                  >
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={
                          item.Offer?.product?.media?.[0]?.url ||
                          "https://placehold.co/100"
                        }
                        alt={item.Offer?.product?.name}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3>{item.Offer?.product?.name}</h3>
                          <p className="ml-4">
                            {formatCurrency(
                              item.priceAtTimeOfPurchase * item.quantity,
                            )}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Qty: {item.quantity} | Seller:{" "}
                          {item.Offer?.sellerProfile?.storeName}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="text-indigo-600" size={24} /> Shipping to
              </h2>
              <div className="text-gray-600 text-sm leading-relaxed">
                <p className="font-bold text-gray-900 text-base mb-1">
                  {order.user?.fullname}
                </p>
                <p>{order.shippingAddress?.addressLine1}</p>
                {order.shippingAddress?.addressLine2 && (
                  <p>{order.shippingAddress?.addressLine2}</p>
                )}
                <p>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}{" "}
                  - {order.shippingAddress?.pincode}
                </p>
                <p className="mt-2 font-medium">
                  PhoneNumber: {order.shippingAddress?.phoneNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Form */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-6 sm:p-8 sticky top-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Payment Details
                </h2>
                <p className="text-gray-500 text-sm">
                  Complete your purchase by providing your payment details.
                </p>
              </div>

              <div className="bg-indigo-50 rounded-xl p-4 mb-8 flex justify-between items-center">
                <span className="text-indigo-900 font-medium">
                  Total Payable
                </span>
                <span className="text-2xl font-bold text-indigo-700">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>

              {clientSecret && stripePromise && (
                <Elements stripe={stripePromise} options={options}>
                  <CheckoutForm order={order} clientSecret={clientSecret} />
                </Elements>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
