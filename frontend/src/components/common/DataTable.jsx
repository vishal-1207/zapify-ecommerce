import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Inbox,
} from "lucide-react";

const DataTable = ({
  columns = [],
  data = [],
  onSearch,
  searchPlaceholder = "Search...",
  filters, // React Node for tabs or filters
  actions, // React Node for buttons like "Add Product"
  loading = false,
  error = null, // Error message or object
  onRetry, // Function to retry fetching data
  emptyMessage = "No records found.",
  pagination, // Optional map for server-pagination: { currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange }
  searchValue, // Optional: Controlled value for search input
  clientPagination = false, // If true, table paginates locally over the data array
}) => {
  const [clientPage, setClientPage] = useState(1);
  const [clientItemsPerPage, setClientItemsPerPage] = useState(10);

  const processedData = useMemo(() => {
    if (!clientPagination) return data;

    const startIndex = (clientPage - 1) * clientItemsPerPage;
    return data.slice(startIndex, startIndex + clientItemsPerPage);
  }, [data, clientPagination, clientPage, clientItemsPerPage]);

  const totalPages = clientPagination
    ? Math.max(1, Math.ceil(data.length / clientItemsPerPage))
    : pagination?.totalPages || 1;

  const currentPage = clientPagination
    ? clientPage
    : pagination?.currentPage || 1;
  const itemsPerPage = clientPagination
    ? clientItemsPerPage
    : pagination?.itemsPerPage || 10;

  const handlePageChange = (newPage) => {
    if (clientPagination) {
      setClientPage(newPage);
    } else if (pagination?.onPageChange) {
      pagination.onPageChange(newPage);
    }
  };

  const handleItemsPerPageChange = (e) => {
    const newVal = Number(e.target.value);
    if (clientPagination) {
      setClientItemsPerPage(newVal);
      setClientPage(1); // Reset to first page
    } else if (pagination?.onItemsPerPageChange) {
      pagination.onItemsPerPageChange(newVal);
    }
  };

  if (clientPagination && clientPage > totalPages && totalPages > 0) {
    setClientPage(totalPages);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header Section */}
      <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
        {/* Left Side: Filters/Tabs */}
        <div className="flex items-center gap-2 flex-1 overflow-x-auto no-scrollbar">
          {filters}
        </div>

        {/* Right Side: Search & Actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full md:w-auto">
          {/* Items Per Page Selector */}
          <div className="flex items-center gap-2 mr-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">
              Show:
            </span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="bg-white border border-gray-200 text-gray-700 text-sm rounded focus:ring-indigo-500 focus:border-indigo-500 px-2 py-1.5 outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>

          {onSearch && (
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue !== undefined ? searchValue : undefined}
                defaultValue={searchValue === undefined ? undefined : undefined}
                onChange={(e) => {
                  if (clientPagination) setClientPage(1); // reset page on search
                  onSearch(e.target.value);
                }}
                className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          )}
          {actions}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className={`px-6 py-4 ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-20 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading data...</p>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="bg-red-50 p-4 rounded-full mb-4">
                      <AlertCircle className="text-red-500" size={32} />
                    </div>
                    <h3 className="text-gray-900 font-semibold mb-2">
                      Failed to load data
                    </h3>
                    <p className="text-gray-500 mb-6 text-center">{error}</p>
                    {onRetry && (
                      <button
                        onClick={onRetry}
                        className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <RefreshCw size={18} />
                        Retry
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : processedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-20 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                      <Inbox className="text-gray-400" size={32} />
                    </div>
                    <p className="text-gray-600 font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              processedData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={`${rowIndex}-${colIndex}`}
                      className={`px-6 py-4 ${col.className || ""}`}
                    >
                      {col.render
                        ? col.render(row)
                        : col.accessor
                          ? row[col.accessor]
                          : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {((clientPagination && data.length > 0) ||
        (pagination && totalPages > 0)) &&
        !loading &&
        !error && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(
                currentPage * itemsPerPage,
                clientPagination ? data.length : Number.MAX_SAFE_INTEGER,
              )}{" "}
              {clientPagination && `of ${data.length}`}
              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-xs">
                Page {currentPage} of {totalPages}
              </span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() =>
                  handlePageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
    </div>
  );
};

export default DataTable;
