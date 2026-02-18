import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Package,
  ArrowLeft,
  Truck,
  MapPin,
  Calendar,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { getOrderDetails } from "../../api/orders";
import { formatCurrency } from "../../utils/currency";

const OrderDetail = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const data = await getOrderDetails(orderId);
        setOrder(data);
      } catch (err) {
        console.error("Failed to fetch order details", err);
        setError("Failed to load order details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-50 p-6 rounded-lg text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
        <h3 className="text-lg font-medium text-red-800">Error</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Link
          to="/account/orders"
          className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center gap-1"
        >
          <ArrowLeft size={16} /> Back to Orders
        </Link>
      </div>
    );

  if (!order) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="mb-8 border-b border-gray-100 pb-6">
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/account/orders"
            className="text-gray-500 hover:text-indigo-600 flex items-center gap-2 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} /> Back to Orders
          </Link>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
              order.status === "delivered"
                ? "bg-green-100 text-green-800"
                : order.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-blue-100 text-blue-800"
            }`}
          >
            {order.status}
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              Order #{order.orderId || order.id.slice(0, 8).toUpperCase()}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Total Amount</p>
            <p className="text-2xl font-bold text-indigo-600">
              {formatCurrency(order.totalAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Order Items */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="text-indigo-600" size={20} /> Order Items
          </h2>
          <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {order.orderItems?.map((item) => (
                <div key={item.id} className="p-4 sm:p-6 flex gap-4 sm:gap-6">
                  <div className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
                    <img
                      src={
                        item.Offer?.product?.media?.[0]?.url ||
                        "https://placehold.co/100"
                      }
                      alt={item.Offer?.product?.name}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
                          {item.Offer?.product?.name}
                        </h3>
                        <p className="font-semibold text-gray-900 ml-4">
                          {formatCurrency(
                            item.priceAtTimeOfPurchase * item.quantity,
                          )}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        Seller: {item.Offer?.sellerProfile?.storeName}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm text-gray-500 bg-white px-2 py-1 rounded border border-gray-200 inline-block">
                        Qty:{" "}
                        <span className="font-medium text-gray-900">
                          {item.quantity}
                        </span>{" "}
                        × {formatCurrency(item.priceAtTimeOfPurchase)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="space-y-6">
          {/* Shipping */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="text-indigo-600" size={20} /> Shipping Details
            </h2>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
              <div className="text-sm text-gray-700 space-y-1.5">
                {order.shippingAddress ? (
                  <>
                    <p className="font-medium text-gray-900 mb-2">
                      Delivery Address
                    </p>
                    <p>{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && (
                      <p>{order.shippingAddress.addressLine2}</p>
                    )}
                    <p>
                      {order.shippingAddress.city},{" "}
                      {order.shippingAddress.state}
                    </p>
                    <p>{order.shippingAddress.pincode}</p>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                        Contact
                      </p>
                      <p className="font-medium">
                        {order.shippingAddress.phoneNumber}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="italic text-gray-500">
                    Address info unavailable
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="text-indigo-600" size={20} /> Payment
              Summary
            </h2>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="text-gray-900 font-bold text-base">
                    Total Paid
                  </span>
                  <span className="text-indigo-600 font-bold text-xl">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
