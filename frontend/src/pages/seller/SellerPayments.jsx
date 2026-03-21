import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSellerTransactions } from "../../store/seller/sellerSlice";
import { formatCurrency } from "../../utils/currency";
import { CreditCard, Package, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import DataTable from "../../components/common/DataTable";

const SellerPayments = () => {
  const dispatch = useDispatch();
  const { transactions, transactionsTotalPages, loading, error } = useSelector(
    (state) => state.seller,
  );

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchSellerTransactions({ page, limit }));
  }, [dispatch, page, limit]);

  if (loading && transactions.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
        <AlertCircle size={20} />
        {error}
      </div>
    );
  }

  const filteredTransactions = transactions.filter(
    (txn) =>
      txn.Offer?.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
      txn.Order?.uniqueOrderId?.toLowerCase().includes(search.toLowerCase()),
  );

  const columns = [
    {
      header: "Transaction Details",
      render: (txn) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Package size={20} />
          </div>
          <div>
            <div
              className="font-medium text-gray-900 max-w-xs truncate"
              title={txn.Offer?.product?.name}
            >
              {txn.Offer?.product?.name || "Unknown Product"}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {new Date(txn.updatedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Order Info",
      render: (txn) => (
        <Link
          to={`/seller/orders?search=${txn.Order?.uniqueOrderId || txn.Order?.id}`}
          className="text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2"
        >
          #{txn.Order?.uniqueOrderId || txn.Order?.id?.slice(0, 8)}
        </Link>
      ),
    },
    {
      header: "Quantity",
      render: (txn) => <span className="text-gray-700">{txn.quantity}x</span>,
    },
    {
      header: "Amount",
      className: "text-right",
      render: (txn) => (
        <>
          <div className="font-bold text-gray-900">
            {formatCurrency(txn.priceAtTimeOfPurchase)}
          </div>
          <div className="text-xs text-gray-500">
            Total: {formatCurrency(txn.priceAtTimeOfPurchase * txn.quantity)}
          </div>
        </>
      ),
    },
    {
      header: "Status",
      className: "text-center",
      render: () => (
        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
          Completed
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CreditCard size={24} className="text-indigo-600" /> Payment &
            Transactions
          </h2>
          <p className="text-gray-500 mt-1">
            View completed sales for your fulfilled orders.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredTransactions}
        loading={loading}
        onSearch={setSearch}
        searchPlaceholder="Search by product name or Order ID..."
        emptyMessage={
          <div className="flex flex-col items-center justify-center text-gray-500 py-12">
            <CreditCard size={48} className="text-gray-300 mb-4" />
            <p className="font-medium text-gray-900 text-lg">
              No transactions found
            </p>
            <p className="mt-1">
              Completed payments for your orders will appear here.
            </p>
          </div>
        }
        pagination={{
          currentPage: page,
          totalPages: transactionsTotalPages,
          onPageChange: setPage,
          itemsPerPage: limit,
          onItemsPerPageChange: setLimit,
        }}
      />
    </div>
  );
};

export default SellerPayments;
