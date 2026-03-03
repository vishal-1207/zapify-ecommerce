import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Package,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { getMyTransactions } from "../../api/payments";
import { formatCurrency } from "../../utils/currency";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  succeeded: {
    label: "Paid",
    color: "text-emerald-600 bg-emerald-50",
    icon: CheckCircle2,
  },
  pending: {
    label: "Pending",
    color: "text-amber-600 bg-amber-50",
    icon: Clock,
  },
  failed: {
    label: "Failed",
    color: "text-red-600 bg-red-50",
    icon: XCircle,
  },
  refunded: {
    label: "Refunded",
    color: "text-indigo-600 bg-indigo-50",
    icon: RotateCcw,
  },
};

const ORDER_STATUS_COLOR = {
  pending: "text-amber-600",
  processed: "text-blue-600",
  shipped: "text-indigo-600",
  delivered: "text-emerald-600",
  cancelled: "text-red-500",
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const methodLabel = (method, details) => {
  if (!method) return "—";
  if (method === "card" && details?.brand) {
    return `${details.brand.toUpperCase()} •••• ${details.last4}`;
  }
  return method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

// ─── Transaction Row ──────────────────────────────────────────────────────────

const TransactionRow = ({ payment }) => {
  const [expanded, setExpanded] = useState(false);
  const order = payment.Order;
  const cfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;
  const items = order?.orderItems || [];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex flex-col sm:flex-row sm:items-center gap-3 p-5 text-left hover:bg-gray-50 transition-colors"
      >
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${cfg.color}`}
        >
          <StatusIcon size={18} />
        </div>

        {/* Transaction ID + date */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-mono truncate mb-0.5">
            TXN: {payment.id.slice(0, 16).toUpperCase()}
          </p>
          {payment.gatewayTransactionId && (
            <p className="text-[10px] text-gray-400 font-mono truncate">
              Gateway: {payment.gatewayTransactionId}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {formatDate(payment.createdAt)}
          </p>
        </div>

        {/* Payment method */}
        <div className="hidden md:block text-center min-w-[140px]">
          <p className="text-xs text-gray-500 mb-0.5">Method</p>
          <p className="text-sm font-medium text-gray-700 flex items-center gap-1 justify-center">
            <CreditCard size={13} className="text-gray-400" />
            {methodLabel(payment.paymentMethod, payment.paymentMethodDetails)}
          </p>
        </div>

        {/* Order status */}
        <div className="hidden md:block text-center min-w-[100px]">
          <p className="text-xs text-gray-500 mb-0.5">Order</p>
          <p
            className={`text-sm font-semibold capitalize ${ORDER_STATUS_COLOR[order?.status] || "text-gray-600"}`}
          >
            {order?.status || "—"}
          </p>
        </div>

        {/* Amount */}
        <div className="text-right min-w-[110px]">
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(payment.amount)}
          </p>
          {payment.refundAmount && (
            <p className="text-xs text-indigo-500 font-medium">
              Refunded {formatCurrency(payment.refundAmount)}
            </p>
          )}
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${cfg.color}`}
          >
            {cfg.label}
          </span>
        </div>

        {/* Expand toggle */}
        <div className="text-gray-400 shrink-0 ml-2">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment details */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                Payment Details
              </h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Status</dt>
                  <dd className={`font-semibold ${cfg.color.split(" ")[0]}`}>
                    {cfg.label}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Gateway</dt>
                  <dd className="font-medium text-gray-700 flex items-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-500" />
                    {payment.paymentGateway}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Method</dt>
                  <dd className="font-medium text-gray-700">
                    {methodLabel(
                      payment.paymentMethod,
                      payment.paymentMethodDetails,
                    )}
                  </dd>
                </div>
                {payment.paymentMethodDetails?.funding && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Card type</dt>
                    <dd className="font-medium text-gray-700 capitalize">
                      {payment.paymentMethodDetails.funding}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-500">Currency</dt>
                  <dd className="font-medium text-gray-700">
                    {payment.currency}
                  </dd>
                </div>
                {payment.refundAmount && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Refunded</dt>
                    <dd className="font-medium text-indigo-600">
                      {formatCurrency(payment.refundAmount)}
                    </dd>
                  </div>
                )}
                {payment.failureMessage && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Failure reason</dt>
                    <dd className="font-medium text-red-500 text-xs">
                      {payment.failureMessage}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Items in this order */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Items ({items.length})
                </h4>
                {order && (
                  <Link
                    to={`/account/orders/${order.id}`}
                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    View Order <ExternalLink size={11} />
                  </Link>
                )}
              </div>
              <div className="space-y-2">
                {items.map((item) => {
                  const product = item.Offer?.product;
                  const thumb = product?.media?.[0]?.url;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 bg-white rounded-xl p-2 border border-gray-100"
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={product?.name}
                          className="w-10 h-10 object-contain rounded-lg bg-gray-50 p-1"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package size={16} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {product?.name || "Product"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity} ×{" "}
                          {formatCurrency(item.priceAtTimeOfPurchase)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-gray-800 shrink-0">
                        {formatCurrency(
                          item.quantity * item.priceAtTimeOfPurchase,
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    getMyTransactions()
      .then(setTransactions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusFilters = ["all", "succeeded", "pending", "failed", "refunded"];

  const filtered =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.status === filter);

  const totalSpent = transactions
    .filter((t) => t.status === "succeeded")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-indigo-600 font-medium">
        Loading transactions...
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <CreditCard size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="text-sm text-gray-500">
              {transactions.length} transactions
            </p>
          </div>
        </div>
        {totalSpent > 0 && (
          <div className="sm:ml-auto bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 text-right">
            <p className="text-xs text-emerald-600 font-medium">Total spent</p>
            <p className="text-lg font-bold text-emerald-700">
              {formatCurrency(totalSpent)}
            </p>
          </div>
        )}
      </div>

      {/* Filter Pills */}
      {transactions.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {statusFilters.map((s) => {
            const count =
              s === "all"
                ? transactions.length
                : transactions.filter((t) => t.status === s).length;
            if (s !== "all" && count === 0) return null;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filter === s
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <CreditCard size={48} className="text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-700 mb-1">
            No transactions found
          </h3>
          <p className="text-gray-500 text-sm">
            {filter !== "all"
              ? `No ${filter} payments yet.`
              : "You haven't made any payments yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((payment) => (
            <TransactionRow key={payment.id} payment={payment} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Transactions;
