import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSellerTransactions } from "../../store/seller/sellerSlice";
import { formatCurrency } from "../../utils/currency";
import { CreditCard, Package, AlertCircle } from "lucide-react";
import Pagination from "../../components/common/Pagination";
import { Link } from "react-router-dom";

const SellerPayments = () => {
  const dispatch = useDispatch();
  const { transactions, transactionsTotalPages, loading, error } = useSelector(
    (state) => state.seller,
  );

  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchSellerTransactions({ page }));
  }, [dispatch, page]);

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

  console.log(transactions);

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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Transaction Details</th>
                <th className="px-6 py-4">Order Info</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions && transactions.length > 0 ? (
                transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
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
                            {new Date(txn.updatedAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/seller/orders?search=${txn.Order?.orderId || txn.Order?.id}`}
                        className="text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2"
                      >
                        #{txn.Order?.orderId || txn.Order?.id?.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{txn.quantity}x</td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-gray-900">
                        {formatCurrency(txn.priceAtTimeOfPurchase)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Total:{" "}
                        {formatCurrency(
                          txn.priceAtTimeOfPurchase * txn.quantity,
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <CreditCard size={48} className="text-gray-300 mb-4" />
                      <p className="font-medium text-gray-900 text-lg">
                        No transactions found
                      </p>
                      <p className="mt-1">
                        Completed payments for your orders will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {transactionsTotalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={transactionsTotalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerPayments;
