import React, { useEffect, useState, useCallback } from "react";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminBrands,
  toggleBrandStatusAction,
  deleteBrandAction,
} from "../../store/admin/adminSlice";
import { createBrand, updateBrand } from "../../api/brands";
import {
  Plus,
  Edit,
  Trash2,
  ToggleRight,
  Upload,
  ImageOff,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { handleApiError } from "../../utils/errorHandler";

/** Renders an image with an animated skeleton placeholder while it loads. */
const ImageWithSkeleton = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Reset state when src changes (e.g. after a new upload)
  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  if (!src || error) {
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">
        <ImageOff size={18} />
      </div>
    );
  }

  return (
    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
      {/* Shimmer skeleton shown until image finishes loading */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-contain transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${className ?? ""}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
};

const AdminBrands = () => {
  const dispatch = useDispatch();
  const {
    brands,
    productsLoading: loading,
    error: reduxError,
  } = useSelector((state) => state.admin);

  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  const fetchBrands = useCallback(() => {
    dispatch(fetchAdminBrands());
  }, [dispatch]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  useEffect(() => {
    if (reduxError) {
      toast.error(reduxError);
      setError(reduxError);
    }
  }, [reduxError]);

  const handleToggleStatus = async (id) => {
    const resultAction = await dispatch(toggleBrandStatusAction(id));
    if (toggleBrandStatusAction.fulfilled.match(resultAction)) {
      const { isActive } = resultAction.payload;
      toast.success(`Brand ${isActive ? "enabled" : "disabled"} successfully`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this brand?")) return;
    const resultAction = await dispatch(deleteBrandAction(id));
    if (deleteBrandAction.fulfilled.match(resultAction)) {
      toast.success("Brand deleted successfully");
    }
  };

  const handleOpenModal = (brand = null) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        name: brand.name,
        description: brand.description || "",
        image: null,
      });
      setImagePreview(brand.media?.[0]?.url || null);
    } else {
      setEditingBrand(null);
      setFormData({ name: "", description: "", image: null });
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (submissionLoading) return;
    setIsModalOpen(false);
    setEditingBrand(null);
    setFormData({ name: "", description: "", image: null });
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      setSubmissionLoading(true);
      if (editingBrand) {
        await updateBrand(editingBrand.id, data);
        toast.success("Brand updated successfully");
      } else {
        await createBrand(data);
        toast.success("Brand created successfully");
      }
      fetchBrands();
      setIsModalOpen(false);
      setEditingBrand(null);
      setFormData({ name: "", description: "", image: null });
      setImagePreview(null);
    } catch (error) {
      const msg = handleApiError(error, "Form submission failed");
      toast.error(msg);
    } finally {
      setSubmissionLoading(false);
    }
  };

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(search.toLowerCase()),
  );

  const columns = [
    {
      header: "Logo",
      render: (brand) => (
        <ImageWithSkeleton
          src={brand.media?.url}
          alt={brand.name}
        />
      ),
    },
    {
      header: "Name",
      accessor: "name",
      className: "font-medium text-gray-900",
    },
    {
      header: "Description",
      render: (brand) => (
        <div className="max-w-xs truncate text-gray-500 text-sm">
          {brand.description || "-"}
        </div>
      ),
    },
    {
      header: "Status",
      render: (brand) => (
        <button
          onClick={() => handleToggleStatus(brand.id)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
            brand.isActive
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {brand.isActive ? (
            <ToggleRight size={16} />
          ) : (
            <ToggleLeft size={16} />
          )}
          {brand.isActive ? "Active" : "Disabled"}
        </button>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      render: (brand) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleOpenModal(brand)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
            title="Edit"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => handleDelete(brand.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
            title="Delete"
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
        data={filteredBrands}
        loading={loading}
        error={error}
        onRetry={fetchBrands}
        onSearch={setSearch}
        clientPagination={true}
        searchPlaceholder="Search brands..."
        emptyMessage="No brands found."
        actions={
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition cursor-pointer"
          >
            <Plus size={20} /> Add Brand
          </button>
        }
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingBrand ? "Edit Brand" : "Add New Brand"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="e.g. Apple"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows="3"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="Brand description..."
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Logo
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-indigo-500 transition-colors cursor-pointer relative group">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={submissionLoading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              {submissionLoading ? (
                <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center z-10 rounded-lg">
                  <Loader2 size={32} className="animate-spin text-indigo-600 mb-2" />
                  <span className="text-sm font-medium text-indigo-600">Uploading...</span>
                </div>
              ) : null}
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-32 object-contain rounded-lg"
                />
              ) : (
                <>
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-indigo-100 transition">
                    <Upload size={24} />
                  </div>
                  <p className="text-sm text-gray-500">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    SVG, PNG, JPG (max. 800x400px)
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={submissionLoading}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submissionLoading}
              className="flex-1 px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold shadow-lg shadow-indigo-200 transition cursor-pointer disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {submissionLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {editingBrand ? "Saving..." : "Creating..."}
                </>
              ) : editingBrand ? (
                "Update Brand"
              ) : (
                "Create Brand"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminBrands;
