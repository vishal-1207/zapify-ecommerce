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
  Star,
  FileText,
} from "lucide-react";
import { 
  getOrderDetails, 
  cancelOrder, 
  requestReturn,
  downloadInvoice 
} from "../../api/orders";
import { createReview } from "../../api/reviews";
import ReviewModal from "../../components/reviews/ReviewModal";
import { formatCurrency } from "../../utils/currency";
import { toast } from "react-hot-toast";

const statusColors = {
  delivered: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  processed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
  return_requested: "bg-orange-100 text-orange-800",
};

const CANCEL_REASONS = [
  "Changed my mind",
  "Ordered by mistake",
  "Found a better price elsewhere",
  "Delivery time is too long",
  "Other",
];

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

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonOther, setCancelReasonOther] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnReasonOther, setReturnReasonOther] = useState("");
  const [isReturning, setIsReturning] = useState(false);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [startingReviewIndex, setStartingReviewIndex] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const unreviewedItems =
    order?.orderItems?.filter((item) => !item.review) || [];

  const handleReviewClick = (itemId) => {
    const index = unreviewedItems.findIndex((item) => item.id === itemId);
    if (index !== -1) {
      setStartingReviewIndex(index);
      setReviewModalOpen(true);
    }
  };

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

  const handleReviewSubmit = async (item, formData) => {
    setIsSubmittingReview(true);
    try {
      await createReview(item.id, formData);
      toast.success("Review submitted successfully!");
      const updated = await getOrderDetails(orderId);
      setOrder(updated);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit review.");
      throw err; // Re-throw so ReviewModal knows it failed
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setIsDownloading(true);
    try {
      const blob = await downloadInvoice(orderId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `invoice-${order?.uniqueOrderId || orderId}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Invoice downloaded successfully!");
    } catch (err) {
      console.error("Failed to download invoice", err);
      toast.error("Failed to generate/download invoice. Please try again.");
    } finally {
      setIsDownloading(false);
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

  const isCancellable = ["pending", "processed"].includes(order.status);
  const isReturnable = order.status === "delivered";

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Top Navigation & Status */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/account/orders"
          className="text-slate-500 hover:text-indigo-600 flex items-center gap-2 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to Orders
        </Link>
        <span
          className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm border ${
            statusColors[order.status] || "bg-gray-100 text-gray-700 border-gray-200"
          }`}
        >
          {order.status.replace("_", " ")}
        </span>
      </div>

      {/* Hero Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Order <span className="text-indigo-600">#{order.uniqueOrderId || order.id.slice(0, 8).toUpperCase()}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-slate-500">
              <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 italic">
                <Calendar size={15} />
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })}
              </span>
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full hidden sm:block"></span>
              <span className="text-sm font-medium">{new Date(order.createdAt).toLocaleTimeString()}</span>
            </div>
            {order.cancellationReason && (
              <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-100">
                <AlertCircle size={14} />
                Reason: {order.cancellationReason}
              </div>
            )}
          </div>

          <div className="flex flex-col items-start md:items-end gap-1 border-t md:border-t-0 pt-4 md:pt-0">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Amount</p>
            <p className="text-4xl font-black text-indigo-600 tracking-tighter">
              {formatCurrency(order.totalAmount)}
            </p>
          </div>
        </div>

        {/* Action Bar - Modern Grid Layout */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-100 pt-8">
          <button
            onClick={handleDownloadInvoice}
            disabled={isDownloading}
            className="group cursor-pointer flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50 transition-all duration-200 shadow-sm"
          >
            <div className={`p-2 rounded-lg ${isDownloading ? "bg-slate-100" : "bg-slate-50 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"}`}>
              {isDownloading ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
            </div>
            <span className="text-sm font-bold text-slate-700">Invoice</span>
          </button>

          {isCancellable && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="group cursor-pointer flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-red-100 bg-red-50/30 hover:bg-red-50 transition-all duration-200"
            >
              <div className="p-2 rounded-lg bg-red-100 text-red-600 group-hover:bg-red-200">
                <XCircle size={20} />
              </div>
              <span className="text-sm font-bold text-red-700">Cancel Order</span>
            </button>
          )}

          {isReturnable && (
            <button
              onClick={() => setShowReturnModal(true)}
              className="group cursor-pointer flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-orange-100 bg-orange-50/30 hover:bg-orange-50 transition-all duration-200"
            >
              <div className="p-2 rounded-lg bg-orange-100 text-orange-500 group-hover:bg-orange-200">
                <RotateCcw size={20} />
              </div>
              <span className="text-sm font-bold text-orange-700 text-center leading-tight">Return &<br/>Refund</span>
            </button>
          )}

          {order.status === "delivered" && unreviewedItems.length > 0 && (
            <button
              onClick={() => handleReviewClick(unreviewedItems[0].id)}
              className="group cursor-pointer flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 transition-all duration-200"
            >
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Star size={20} />
              </div>
              <span className="text-sm font-bold text-indigo-700 text-center leading-tight">Review Items</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Order Items */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <Package className="text-indigo-600 shrink-0" size={24} /> 
            Order Items
          </h2>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {order.orderItems?.map((item) => (
                <div key={item.id} className="p-4 sm:p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex gap-4 sm:gap-6">
                    <div className="h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                      <img
                        src={item.Offer?.product?.media?.[0]?.url || "https://placehold.co/150"}
                        alt={item.Offer?.product?.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 line-clamp-2 leading-snug">
                            {item.Offer?.product?.name}
                          </h3>
                          <p className="mt-1 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Seller: <span className="text-indigo-600">{item.Offer?.sellerProfile?.storeName}</span>
                          </p>
                        </div>
                        <p className="text-xl font-black text-slate-900 whitespace-nowrap">
                          {formatCurrency(item.priceAtTimeOfPurchase * item.quantity)}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center justify-between gap-4 mt-auto pt-4">
                        <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-sm">
                          <span className="text-slate-400 font-bold">Qty:</span>
                          <span className="font-black text-slate-900">{item.quantity}</span>
                          <span className="text-slate-300 mx-1">|</span>
                          <span className="font-medium text-slate-600">{formatCurrency(item.priceAtTimeOfPurchase)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {order.status === "delivered" && !item.review && (
                            <button
                              onClick={() => handleReviewClick(item.id)}
                              className="cursor-pointer text-sm font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 px-4 py-2 rounded-xl transition-all duration-200 border border-indigo-100"
                            >
                              Leave a rating
                            </button>
                          )}

                          {order.status === "delivered" && item.review && (
                            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 text-sm font-bold">
                              <ShieldCheck size={18} />
                              Reviewed
                            </div>
                          )}
                        </div>
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
            <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-3">
              <MapPin className="text-indigo-600 shrink-0" size={24} /> 
              Shipping Details
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="text-sm text-slate-600 space-y-3">
                {order.shippingAddress ? (
                  <>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Delivery Address</p>
                      <p className="text-slate-900 font-bold text-lg leading-tight uppercase">
                        {order.shippingAddress.fullname || order.user?.fullname}
                      </p>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                      <p className="font-medium text-slate-700">{order.shippingAddress.addressLine1}</p>
                      {order.shippingAddress.addressLine2 && (
                        <p className="font-medium text-slate-700">{order.shippingAddress.addressLine2}</p>
                      )}
                      <p className="font-bold text-slate-900">
                        {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">
                        Contact Number
                      </p>
                      <p className="font-extrabold text-slate-900 text-lg">
                        {order.shippingAddress.phoneNumber}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center">
                    <AlertCircle className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="italic text-slate-400">Address information unavailable for this order.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div>
            <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-3">
              <CreditCard className="text-indigo-600 shrink-0" size={24} /> 
              Payment Summary
            </h2>
            <div className="bg-indigo-600 rounded-2xl p-1 shadow-lg shadow-indigo-100">
              <div className="bg-white rounded-xl p-6">
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="font-medium">MRP Total</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(Number(order.mrp) > 0 ? order.mrp : order.totalAmount)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="font-medium">Selling Price</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(sellerPriceTotal)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-500">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(
                        Number(order.subtotalAmount) > 0
                          ? Number(order.subtotalAmount) - Number(order.taxAmount)
                          : Number(order.totalAmount) - Number(order.taxAmount),
                      )}
                    </span>
                  </div>

                  {Number(order.taxAmount) > 0 && (
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="font-medium">Tax (18% GST)</span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(order.taxAmount)}
                      </span>
                    </div>
                  )}

                  {Number(order.discountAmount) > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 bg-emerald-50/50 px-3 py-2 rounded-lg border border-emerald-100">
                      <span className="font-bold">Total Discount</span>
                      <span className="font-black">
                        -{formatCurrency(order.discountAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-slate-500">
                    <span className="font-medium">Delivery Fee</span>
                    <span className="font-bold text-slate-900">
                      {Number(order.deliveryFee) > 0 ? (
                        formatCurrency(order.deliveryFee)
                      ) : (
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter">Free</span>
                      )}
                    </span>
                  </div>

                  <div className="border-t-2 border-dashed border-slate-100 pt-4 mt-2 flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest block mb-0.5">Grand Total</span>
                      <span className="text-slate-900 font-black text-lg">Total Paid</span>
                    </div>
                    <span className="text-indigo-600 font-extrabold text-3xl tracking-tighter">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cancel Order Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 animate-backdrop">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-modal-slide">
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
                className="cursor-pointer text-gray-400 hover:text-gray-600"
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
                className="cursor-pointer flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling || !cancelReason}
                className="cursor-pointer flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60"
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
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 animate-backdrop">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-modal-slide">
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
                className="cursor-pointer text-gray-400 hover:text-gray-600"
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
                className="cursor-pointer flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReturn}
                disabled={isReturning || !returnReason}
                className="cursor-pointer flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60"
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

      {/* ── Review Modal ── */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onSubmit={handleReviewSubmit}
        isSubmitting={isSubmittingReview}
        itemsToReview={unreviewedItems}
        startingIndex={startingReviewIndex}
      />
    </div>
  );
};

export default OrderDetail;
