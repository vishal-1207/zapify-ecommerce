import React, { useEffect, useState } from "react";
import { formatCurrency } from "../../utils/currency";
import Modal from "../../components/common/Modal";
import DataTable from "../../components/common/DataTable";
import ProductForm from "../../components/products/ProductForm";
import {
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  ToggleLeft,
  ToggleRight,
  Plus,
  Search,
  X,
  Upload,
  ArrowRight,
  ArrowLeft,
  MinusCircle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminProducts,
  approveProductAction,
  rejectProductAction,
  toggleProductStatusAction,
  deleteProductAction,
} from "../../store/admin/adminSlice";
import api from "../../api/axios";
import { updateProduct, getAdminProductDetails } from "../../api/products";
import { getAllCategories } from "../../api/categories";
import { getAllBrands } from "../../api/brands";
import { toast } from "react-hot-toast";
import { handleApiError } from "../../utils/errorHandler";

const AdminProducts = () => {
  const dispatch = useDispatch();
  const {
    products,
    loading,
    error: reduxError,
  } = useSelector((state) => state.admin);

  const [activeTab, setActiveTab] = useState("all");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategoriesAndBrands();
  }, [activeTab]);

  useEffect(() => {
    if (reduxError) {
      toast.error(reduxError);
      setError(reduxError);
    }
  }, [reduxError]);

  const fetchProducts = () => {
    dispatch(fetchAdminProducts(activeTab));
  };

  const fetchCategoriesAndBrands = async () => {
    try {
      const [cats, brnds] = await Promise.all([
        getAllCategories(),
        getAllBrands(),
      ]);
      setCategories(cats);
      setBrands(brnds);
    } catch (error) {
      handleApiError(error, "Failed to fetch categories/brands");
    }
  };

  const handleApprove = async (productId) => {
    const resultAction = await dispatch(approveProductAction(productId));
    if (approveProductAction.fulfilled.match(resultAction)) {
      toast.success("Product approved");
      fetchProducts();
    }
  };

  const handleReject = async (productId) => {
    if (!window.confirm("Are you sure you want to reject this product?"))
      return;
    const resultAction = await dispatch(rejectProductAction(productId));
    if (rejectProductAction.fulfilled.match(resultAction)) {
      toast.success("Product rejected");
      fetchProducts();
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    const resultAction = await dispatch(deleteProductAction(productId));
    if (deleteProductAction.fulfilled.match(resultAction)) {
      toast.success("Product deleted");
    }
  };

  const handleToggleStatus = async (productId) => {
    const resultAction = await dispatch(toggleProductStatusAction(productId));
    if (toggleProductStatusAction.fulfilled.match(resultAction)) {
      const { isActive } = resultAction.payload;
      toast.success(
        `Product ${isActive ? "enabled" : "disabled"} successfully`,
      );
    }
  };

  const handleOpenModal = async (product = null) => {
    if (product) {
      try {
        // Fetch full details
        const fullProduct = await getAdminProductDetails(product.id);
        setEditingProduct(fullProduct);
        setIsModalOpen(true);
      } catch (error) {
        const msg = handleApiError(error, "Failed to fetch product details");
        toast.error(msg);
      }
    } else {
      setEditingProduct(null);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (data) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        toast.success("Product updated successfully");
      } else {
        await createProduct(data);
        toast.success("Product created successfully");
      }
      fetchProducts();
      handleCloseModal();
    } catch (error) {
      const msg = handleApiError(error, "Form submission failed");
      toast.error(msg);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const columns = [
    {
      header: "Product",
      render: (product) => (
        <div className="flex items-center gap-3">
          {product.media?.[0]?.url ? (
            <img
              src={product.media[0].url}
              alt={product.name}
              className="w-12 h-12 rounded-md object-cover border border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">
              <Upload size={16} />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-800 line-clamp-1">
              {product.name}
            </p>
            <p className="text-xs text-gray-500">
              ID: {product.id.slice(0, 8)}...
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      render: (product) => product.category?.name || "N/A",
    },
    {
      header: "Brand",
      render: (product) => product.brand?.name || "N/A",
    },
    {
      header: "MRP",
      render: (product) => formatCurrency(product.price),
      className: "font-medium text-gray-800",
    },
    {
      header: "Stock",
      accessor: "totalOfferStock",
    },
    {
      header: "Status",
      render: (product) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            product.status === "active" || product.status === "approved"
              ? "bg-green-100 text-green-800"
              : product.status === "pending"
                ? "bg-orange-100 text-orange-800"
                : "bg-red-100 text-red-800"
          }`}
        >
          {product.status}
        </span>
      ),
    },
    {
      header: "Visibility",
      render: (product) => (
        <button
          onClick={() => handleToggleStatus(product.id)}
          title={
            product.isActive
              ? "Disable (Hide from shop)"
              : "Enable (Show in shop)"
          }
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
            product.isActive
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {product.isActive ? (
            <ToggleRight size={16} />
          ) : (
            <ToggleLeft size={16} />
          )}
          {product.isActive ? "Active" : "Disabled"}
        </button>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      render: (product) => (
        <div className="flex items-center justify-end gap-2">
          {activeTab === "pending" && (
            <>
              <button
                onClick={() => handleApprove(product.id)}
                className="p-1.5 text-green-600 hover:bg-green-100 rounded-md"
                title="Approve"
              >
                <CheckCircle size={18} />
              </button>
              <button
                onClick={() => handleReject(product.id)}
                className="p-1.5 text-red-600 hover:bg-red-100 rounded-md"
                title="Reject"
              >
                <XCircle size={18} />
              </button>
            </>
          )}
          <button
            onClick={() => handleOpenModal(product)}
            title="Edit"
            className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-md cursor-pointer"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => handleDelete(product.id)}
            title="Delete"
            className="p-1.5 text-red-600 hover:bg-red-100 rounded-md cursor-pointer"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={filteredProducts}
        loading={loading}
        error={error}
        onRetry={fetchProducts}
        onSearch={setSearch}
        searchPlaceholder="Search products..."
        emptyMessage="No products found."
        filters={
          <div className="flex">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${
                activeTab === "all"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              All Products
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 font-medium text-sm rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === "pending"
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Pending Approval
            </button>
          </div>
        }
        actions={
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus size={20} /> Add Product
          </button>
        }
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? "Edit Product" : "Add New Product"}
        maxWidth="max-w-2xl"
      >
        <ProductForm
          initialData={editingProduct}
          categories={categories}
          brands={brands}
          onSubmit={async (formData) => {
            await handleSubmit(formData);
          }}
          onCancel={handleCloseModal}
          isLoading={loading}
          showStock={false}
        />
      </Modal>
    </div>
  );
};

export default AdminProducts;
