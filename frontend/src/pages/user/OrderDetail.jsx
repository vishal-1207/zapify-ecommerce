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
  XCircle,
  RotateCcw,
  Loader2,
  X,
  ShieldCheck,
} from "lucide-react";
import { getOrderDetails, cancelOrder, requestReturn } from "../../api/orders";
import { formatCurrency } from "../../utils/currency";
import { toast } from "react-hot-toast";

// Status badge colours including the new states
const statusColors = {
  delivered: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
  return_requested: "bg-orange-100 text-orange-800",
};

// CANCEL reasons — pre-populated for UX
const CANCEL_REASONS = [
  "Changed my mind",
  "Ordered by mistake",
  "Found a better price elsewhere",
  "Delivery time is too long",
  "Other",
];

// RETURN reasons
const RETURN_REASONS = [
  "Item is damaged or defective",
  "Item does not match description",
  "Wrong item delivered",
  "Item is not as expected",
  "Other",
];

const OrderDetail = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonOther, setCancelReasonOther] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Return modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnReasonOther, setReturnReasonOther] = useState("");
  const [isReturning, setIsReturning] = useState(false);

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

  const handleCancel = async () => {
    const reason =
      cancelReason === "Other" ? cancelReasonOther.trim() : cancelReason;
    if (!reason || reason.length < 5) {
      toast.error("Please provide a reason for cancellation.");
      return;
    }
    setIsCancelling(true);
    try {
      await cancelOrder(orderId, reason);
      toast.success(
        "Order cancelled. Refund will be processed in 5–7 business days.",
      );
      setShowCancelModal(false);
      // Refresh order data
      const updated = await getOrderDetails(orderId);
      setOrder(updated);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to cancel the order.",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReturn = async () => {
    const reason =
      returnReason === "Other" ? returnReasonOther.trim() : returnReason;
    if (!reason || reason.length < 5) {
      toast.error("Please provide a reason for the return.");
      return;
    }
    setIsReturning(true);
    try {
      await requestReturn(orderId, reason);
      toast.success(
        "Return request submitted! Refund will be processed in 5–7 business days.",
      );
      setShowReturnModal(false);
      const updated = await getOrderDetails(orderId);
      setOrder(updated);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to submit return request.",
      );
    } finally {
      setIsReturning(false);
    }
  };

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

  const sellerPriceTotal =
    order.orderItems?.reduce((sum, item) => {
      return (
        sum +
        (Number(item.Offer?.price) || Number(item.priceAtTimeOfPurchase) || 0) *
          item.quantity
      );
    }, 0) || 0;

  const isCancellable = ["pending", "processing"].includes(order.status);
  const isReturnable = order.status === "delivered";

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
              statusColors[order.status] || "bg-gray-100 text-gray-700"
            }`}
          >
            {order.status.replace("_", " ")}
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

            {/* Cancellation reason shown if present */}
            {order.cancellationReason && (
              <p className="mt-2 text-sm text-gray-500 italic">
                Reason: {order.cancellationReason}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-indigo-600">
                {formatCurrency(order.totalAmount)}
              </p>
            </div>

            {/* Action Buttons */}
            {isCancellable && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <XCircle size={15} /> Cancel Order
              </button>
            )}
            {isReturnable && (
              <button
                onClick={() => setShowReturnModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <RotateCcw size={15} /> Return & Refund
              </button>
            )}
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
                  <span>MRP Total</span>
                  <span className="font-medium">
                    {formatCurrency(
                      Number(order.mrp) > 0 ? order.mrp : order.totalAmount,
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Selling Price</span>
                  <span className="font-medium">
                    {formatCurrency(sellerPriceTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(
                      Number(order.subtotalAmount) > 0
                        ? order.subtotalAmount
                        : order.totalAmount,
                    )}
                  </span>
                </div>
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Total Discount</span>
                    <span className="font-medium">
                      -{formatCurrency(order.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-medium">
                    {Number(order.deliveryFee) > 0 ? (
                      formatCurrency(order.deliveryFee)
                    ) : (
                      <span className="text-green-600">Free</span>
                    )}
                  </span>
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

      {/* ── Cancel Order Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <XCircle size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Cancel Order</h3>
                  <p className="text-xs text-gray-500">
                    Refund will be issued to your original payment method.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Why do you want to cancel?
              </p>
              {CANCEL_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    cancelReason === r
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={r}
                    checked={cancelReason === r}
                    onChange={() => setCancelReason(r)}
                    className="accent-red-500"
                  />
                  <span className="text-sm text-gray-700">{r}</span>
                </label>
              ))}
              {cancelReason === "Other" && (
                <textarea
                  placeholder="Please describe your reason..."
                  value={cancelReasonOther}
                  onChange={(e) => setCancelReasonOther(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none mt-2 resize-none"
                />
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex gap-2">
              <ShieldCheck
                size={16}
                className="text-yellow-600 shrink-0 mt-0.5"
              />
              <p className="text-xs text-yellow-700">
                If payment was made, a full refund will be initiated
                automatically. Allow 5–7 business days for the amount to
                reflect.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling || !cancelReason}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isCancelling ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  "Confirm Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Return & Refund Modal ── */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <RotateCcw size={20} className="text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Return & Refund</h3>
                  <p className="text-xs text-gray-500">
                    Returns accepted within 7 days of delivery.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Reason for return
              </p>
              {RETURN_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    returnReason === r
                      ? "border-orange-400 bg-orange-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="returnReason"
                    value={r}
                    checked={returnReason === r}
                    onChange={() => setReturnReason(r)}
                    className="accent-orange-500"
                  />
                  <span className="text-sm text-gray-700">{r}</span>
                </label>
              ))}
              {returnReason === "Other" && (
                <textarea
                  placeholder="Please describe your reason..."
                  value={returnReasonOther}
                  onChange={(e) => setReturnReasonOther(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none mt-2 resize-none"
                />
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex gap-2">
              <ShieldCheck
                size={16}
                className="text-blue-600 shrink-0 mt-0.5"
              />
              <p className="text-xs text-blue-700">
                Once your return is approved, a full refund will be credited to
                your original payment method within 5–7 business days.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReturnModal(false)}
                disabled={isReturning}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReturn}
                disabled={isReturning || !returnReason}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isReturning ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  "Submit Request"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
