import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { formatCurrency } from "../../utils/currency";
import DataTable from "../../components/common/DataTable";
import {
  Eye,
  Filter,
  CheckCircle,
  Clock,
  Truck,
  Package,
  XCircle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSellerOrders,
  updateOrderStatusAction,
} from "../../store/seller/sellerSlice";
import { toast } from "react-hot-toast";
import debounce from "lodash/debounce";

const SellerOrders = () => {
  const dispatch = useDispatch();
  const {
    orders,
    loading,
    ordersTotalPages,
    error: reduxError,
  } = useSelector((state) => state.seller);

  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchOrders = useCallback(() => {
    dispatch(fetchSellerOrders({ page, search, status: statusFilter }));
  }, [dispatch, page, search, statusFilter]);

  useEffect(() => {
    if (reduxError) {
      toast.error(reduxError);
    }
  }, [reduxError]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = debounce((value) => {
    setSearch(value);
    setPage(1);
  }, 500);

  const handleStatusUpdate = async (orderId, newStatus) => {
    const resultAction = await dispatch(
      updateOrderStatusAction({ orderId, newStatus }),
    );
    if (updateOrderStatusAction.fulfilled.match(resultAction)) {
      toast.success(`Order status updated to ${newStatus}`);
    } else {
      toast.error("Failed to update status");
    }
  };

  const getStatusBadge = (status) => {
    const base =
      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap";
    switch (status) {
      case "pending":
        return (
          <span className={`${base} bg-yellow-100 text-yellow-800`}>
            <Clock size={11} /> Pending
          </span>
        );
      case "processing":
        return (
          <span className={`${base} bg-blue-100 text-blue-800`}>
            <Package size={11} /> Processing
          </span>
        );
      case "shipped":
        return (
          <span className={`${base} bg-indigo-100 text-indigo-800`}>
            <Truck size={11} /> Shipped
          </span>
        );
      case "delivered":
        return (
          <span className={`${base} bg-green-100 text-green-800`}>
            <CheckCircle size={11} /> Delivered
          </span>
        );
      case "cancelled":
        return (
          <span className={`${base} bg-red-100 text-red-800`}>
            <XCircle size={11} /> Cancelled
          </span>
        );
      case "return_requested":
        return (
          <span className={`${base} bg-orange-100 text-orange-700`}>
            <XCircle size={11} /> Return Requested
          </span>
        );
      case "refunded":
        return (
          <span className={`${base} bg-purple-100 text-purple-700`}>
            <CheckCircle size={11} /> Refunded
          </span>
        );
      default:
        return (
          <span className={`${base} bg-gray-100 text-gray-700 capitalize`}>
            {status?.replace(/_/g, " ") ?? "—"}
          </span>
        );
    }
  };

  const columns = [
    {
      header: "Order Date",
      render: (item) => new Date(item.createdAt).toLocaleDateString(),
    },
    {
      header: "Product",
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.Offer?.product?.media?.[0]?.url ? (
            <img
              src={item.Offer.product.media[0].url}
              alt={item.Offer.product.name}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
              No Img
            </div>
          )}
          <div className="max-w-[200px]">
            <p className="font-medium text-gray-900 line-clamp-1">
              {item.Offer?.product?.name}
            </p>
            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Customer",
      render: (item) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            {item.Order?.orderId || "N/A"}
          </p>
          <p className="text-xs text-indigo-600 mb-1">
            {item.Order?.user?.name || "Guest"}
          </p>
          <p className="text-xs text-gray-500">
            {item.Order?.shippingAddress?.city},{" "}
            {item.Order?.shippingAddress?.zipCode}
          </p>
        </div>
      ),
    },
    {
      header: "Amount",
      render: (item) => (
        <span className="font-medium">
          {formatCurrency(item.priceAtTimeOfPurchase * item.quantity)}
        </span>
      ),
    },
    {
      header: "Status",
      render: (item) => getStatusBadge(item.status),
    },
    {
      header: "Actions",
      className: "text-right",
      render: (item) => (
        <div className="flex justify-end gap-2 relative group">
          {/* Simple Status Dropdown for MVP */}
          <select
            className="text-xs border border-gray-200 rounded p-1 bg-white hover:border-indigo-300 focus:outline-none"
            value={item.status}
            onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
            disabled={["cancelled", "delivered"].includes(item.status)}
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Orders</h2>
          <p className="text-gray-500 text-sm">
            Manage orders for your products.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        onSearch={handleSearch}
        searchPlaceholder="Search by product name or Order ID..."
        emptyMessage="No orders found."
        pagination={{
          currentPage: page,
          totalPages: ordersTotalPages,
          onPageChange: setPage,
        }}
        filters={
          <select
            className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        }
      />
    </div>
  );
};

export default SellerOrders;
