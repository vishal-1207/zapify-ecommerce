import React, { useEffect, useState } from "react";
import { formatCurrency } from "../../utils/currency";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminOrders,
  fetchOrderDetails,
  updateOrderStatusAction,
  refundOrderAction,
} from "../../store/admin/adminSlice";
import { X, Loader2, Package, RefreshCcw } from "lucide-react";
import { toast } from "react-hot-toast";

const STATUS_OPTIONS = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const statusColors = {
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  shipped: "bg-purple-100 text-purple-800",
  processing: "bg-yellow-100 text-yellow-800",
  pending: "bg-blue-100 text-blue-800",
  return_requested: "bg-orange-100 text-orange-700",
  refunded: "bg-purple-100 text-purple-700",
};

// Formats a raw status string like "return_requested" → "Return Requested"
const formatStatus = (s) =>
  s?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "—";

const AdminOrders = () => {
  const dispatch = useDispatch();
  const {
    orders,
    selectedOrder,
    loading,
    ordersTotalPages: totalPages,
  } = useSelector((state) => state.admin);

  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("requested_by_customer");
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminOrders({ page, limit: 10 }));
  }, [page, dispatch]);

  const openOrder = (orderId) => {
    setIsModalOpen(true);
    dispatch(fetchOrderDetails(orderId));
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedOrder || newStatus === selectedOrder.status) return;
    setStatusUpdating(true);
    try {
      await dispatch(
        updateOrderStatusAction({
          orderId: selectedOrder.id,
          status: newStatus,
        }),
      ).unwrap();
      toast.success(`Order status updated to "${newStatus}".`);
    } catch (err) {
      toast.error(err || "Failed to update status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedOrder) return;
    setIsRefunding(true);
    try {
      await dispatch(
        refundOrderAction({
          orderId: selectedOrder.id,
          amount: refundAmount ? parseFloat(refundAmount) : null,
          reason: refundReason,
        }),
      ).unwrap();
      toast.success("Refund initiated successfully!");
      setShowRefundModal(false);
      setRefundAmount("");
      dispatch(fetchOrderDetails(selectedOrder.id));
      dispatch(fetchAdminOrders({ page, limit: 10 }));
    } catch (err) {
      toast.error(err || "Failed to initiate refund.");
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800">All Orders</h2>
      </div>

      <div className="p-0">
        {loading && orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Fulfilling Seller(s)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-indigo-600">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        {order.user ? (
                          <>
                            <p className="font-medium text-gray-800">
                              {order.user.fullname}
                            </p>
                            <p className="text-xs text-gray-500">
                              {order.user.email}
                            </p>
                          </>
                        ) : (
                          <span className="text-gray-400">Guest / Deleted</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4">
                      {order.orderItems && order.orderItems.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {Array.from(
                            new Set(
                              order.orderItems
                                .map(
                                  (item) =>
                                    item.Offer?.sellerProfile?.storeName,
                                )
                                .filter(Boolean),
                            ),
                          ).map((storeName, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md shadow-sm border border-indigo-100 font-medium"
                            >
                              {storeName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          No Seller Data
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[order.status] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openOrder(order.id)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium text-xs hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Order Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 ">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Order Details
                </h3>
                {selectedOrder && (
                  <p className="text-sm text-gray-500 font-mono mt-0.5">
                    #{selectedOrder.id?.slice(0, 8)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedOrder && selectedOrder.status !== "cancelled" && (
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors"
                  >
                    <RefreshCcw size={14} /> Refund
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {loading && !selectedOrder ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
              </div>
            ) : selectedOrder ? (
              <div className="overflow-y-auto divide-y divide-gray-100">
                {/* Customer + Status Section */}
                <div className="p-6 grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                      Customer
                    </p>
                    <p className="font-semibold text-gray-900">
                      {selectedOrder.user?.fullname || "Deleted User"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedOrder.user?.email}
                    </p>
                    {selectedOrder.user?.phoneNumber && (
                      <p className="text-sm text-gray-500">
                        {selectedOrder.user.phoneNumber}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                      Shipping Address
                    </p>
                    {selectedOrder.shippingAddress ? (
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {[
                          selectedOrder.shippingAddress.line1,
                          selectedOrder.shippingAddress.line2,
                          selectedOrder.shippingAddress.city,
                          selectedOrder.shippingAddress.state,
                          selectedOrder.shippingAddress.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">N/A</p>
                    )}
                  </div>
                </div>

                {/* Update Status */}
                <div className="p-6">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                    Update Order Status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        disabled={statusUpdating}
                        onClick={() => handleStatusChange(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition-all ${
                          selectedOrder.status === s
                            ? `${statusColors[s]} border-transparent ring-2 ring-offset-1 ring-indigo-400`
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                        } disabled:opacity-60`}
                      >
                        {statusUpdating && selectedOrder.status !== s ? (
                          <span className="flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" /> {s}
                          </span>
                        ) : (
                          s
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-3">
                    Items ({selectedOrder.orderItems?.length || 0})
                  </p>
                  <div className="space-y-3">
                    {selectedOrder.orderItems?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center">
                            <Package size={16} className="text-indigo-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {item.Offer?.product?.name || "Unknown Product"}
                            </p>
                            <p className="text-xs text-gray-500">
                              Sold by{" "}
                              <span className="font-medium text-indigo-600">
                                {item.Offer?.sellerProfile?.storeName ||
                                  "Unknown Seller"}
                              </span>
                              {" · "}Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-800 text-sm">
                            {formatCurrency(item.priceAtTimeOfPurchase)}
                          </p>
                          <span
                            className={`inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              statusColors[item.status] ||
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {formatStatus(item.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="p-6 bg-gray-50">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-3">
                    Order Summary
                  </p>
                  <div className="space-y-2 text-sm">
                    {selectedOrder.mrp && parseFloat(selectedOrder.mrp) > 0 && (
                      <div className="flex justify-between text-gray-500">
                        <span>MRP Total</span>
                        <span className="line-through">
                          {formatCurrency(selectedOrder.mrp)}
                        </span>
                      </div>
                    )}
                    {selectedOrder.subtotalAmount && (
                      <div className="flex justify-between text-gray-700">
                        <span>Subtotal</span>
                        <span>
                          {formatCurrency(selectedOrder.subtotalAmount)}
                        </span>
                      </div>
                    )}
                    {selectedOrder.discountAmount &&
                      parseFloat(selectedOrder.discountAmount) > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span>
                            - {formatCurrency(selectedOrder.discountAmount)}
                          </span>
                        </div>
                      )}
                    {selectedOrder.deliveryFee !== undefined && (
                      <div className="flex justify-between text-gray-700">
                        <span>Delivery Fee</span>
                        <span>
                          {parseFloat(selectedOrder.deliveryFee) === 0
                            ? "Free"
                            : formatCurrency(selectedOrder.deliveryFee)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
                      <span>Total Paid</span>
                      <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                Order not found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refund Confirmation Sub-Modal */}
      {showRefundModal && selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <RefreshCcw size={20} className="text-orange-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Initiate Refund</h3>
                <p className="text-sm text-gray-500">
                  Order #{selectedOrder.id?.slice(0, 8)} ·{" "}
                  {formatCurrency(selectedOrder.totalAmount)}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={`Leave blank for full refund (${formatCurrency(selectedOrder.totalAmount)})`}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none bg-white"
                >
                  <option value="requested_by_customer">
                    Requested by Customer
                  </option>
                  <option value="duplicate">Duplicate Order</option>
                  <option value="fraudulent">Fraudulent</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundAmount("");
                }}
                disabled={isRefunding}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={isRefunding}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isRefunding ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Confirm Refund"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
