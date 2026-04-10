import React, { useEffect, useState, useCallback } from "react";
import { formatCurrency } from "../../utils/currency";
import DataTable from "../../components/common/DataTable";
import {
  Plus,
  Eye,
  Filter,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { updateSellerOffer } from "../../api/seller";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSellerOffers,
  toggleOfferStatusAction,
  deleteOfferAction,
} from "../../store/seller/sellerSlice";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import EditOfferModal from "../../components/seller/EditOfferModal";

const SellerProducts = () => {
  const dispatch = useDispatch();
  const {
    offers,
    loading,
    totalPages,
    error: reduxError,
  } = useSelector((state) => state.seller);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);

  const navigate = useNavigate();

  const fetchOffers = useCallback(() => {
    dispatch(fetchSellerOffers({ page, limit, status: statusFilter }));
  }, [dispatch, page, limit, statusFilter]);

  useEffect(() => {
    if (reduxError) {
      toast.error(reduxError);
    }
  }, [reduxError]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers, refreshTrigger]);

  const handleDelete = async (offerId) => {
    if (!window.confirm("Are you sure you want to delete this offer?")) return;
    const resultAction = await dispatch(deleteOfferAction(offerId));
    if (deleteOfferAction.fulfilled.match(resultAction)) {
      toast.success("Offer deleted successfully");
    } else {
      toast.error(resultAction.payload || "Failed to delete offer");
    }
  };

  const handleStatusToggle = async (offer, currentStatus) => {
    const resultAction = await dispatch(
      toggleOfferStatusAction({ offerId: offer.id, currentStatus }),
    );
    if (toggleOfferStatusAction.fulfilled.match(resultAction)) {
      const { newStatus } = resultAction.payload;
      toast.success(
        `Offer ${newStatus === "active" ? "activated" : "deactivated"}`,
      );
    } else {
      toast.error("Failed to update status");
    }
  };

  const handleEditClick = (offer) => {
    setSelectedOffer(offer);
    setIsEditModalOpen(true);
  };

  const handleEditSave = async (offerId, data) => {
    await updateSellerOffer(offerId, data);
    toast.success("Offer updated successfully");
    setRefreshTrigger((prev) => prev + 1);
  };

  const columns = [
    {
      header: "Product",
      render: (offer) => (
        <div className="flex items-center gap-3">
          {offer.product.media?.[0]?.url ? (
            <img
              src={offer.product.media[0].url}
              alt={offer.product.name}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
              No Img
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900 line-clamp-1">
              {offer.product.name}
            </p>
            <p className="text-xs text-gray-500">
              Model: {offer.product.model || "N/A"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      render: (offer) => offer.product.category?.name || "N/A",
    },
    {
      header: "Price",
      render: (offer) => (
        <span className="font-medium">{formatCurrency(offer.price)}</span>
      ),
    },
    {
      header: "Stock",
      render: (offer) => (
        <span
          className={`font-medium ${offer.stockQuantity < 5 ? "text-red-600" : "text-gray-700"}`}
        >
          {offer.stockQuantity}
        </span>
      ),
    },
    {
      header: "Status",
      render: (offer) => (
        <button
          onClick={() => handleStatusToggle(offer, offer.status)}
          className={`cursor-pointer inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
            offer.status === "active"
              ? "bg-green-100 text-green-800 hover:bg-green-200"
              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
          }`}
        >
          {offer.status === "active" ? (
            <CheckCircle size={12} />
          ) : (
            <XCircle size={12} />
          )}
          {offer.status === "active" ? "Active" : "Draft"}
        </button>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      render: (offer) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleEditClick(offer)}
            className="cursor-pointer p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
            title="Edit"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => handleDelete(offer.id)}
            className="cursor-pointer p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  const filteredOffers = offers.filter(
    (offer) =>
      offer.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
      offer.product?.model?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Consignments</h2>
          <p className="text-gray-500 text-sm">
            Manage your product suggestions and inventory.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredOffers}
        loading={loading}
        onSearch={setSearch}
        searchPlaceholder="Search products..."
        emptyMessage="No products found."
        pagination={{
          currentPage: page,
          totalPages: totalPages,
          onPageChange: setPage,
          itemsPerPage: limit,
          onItemsPerPageChange: setLimit,
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
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </select>
        }
        actions={
          <button
            onClick={() => navigate("/seller/products/add")}
            className="cursor-pointer flex items-center gap-2 bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
            title="Add Product"
          >
            <Plus size={18} />
            <span className="hidden sm:inline font-bold text-sm">Add Product</span>
          </button>
        }
      />

      {selectedOffer && (
        <EditOfferModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          offer={selectedOffer}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
};

export default SellerProducts;
