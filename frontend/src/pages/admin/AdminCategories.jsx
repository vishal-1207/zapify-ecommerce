import React, { useEffect, useState } from "react";
import Modal from "../../components/common/Modal";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import DataTable from "../../components/common/DataTable";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
} from "../../api/categories";
import {
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Upload,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { handleApiError } from "../../utils/errorHandler";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);
  
  const [editingCategory, setEditingCategory] = useState(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [deletionLoading, setDeletionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      const msg = handleApiError(error, "Failed to fetch categories");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await toggleCategoryStatus(id);
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === id ? { ...cat, isActive: response.category.isActive } : cat
        )
      );
      toast.success(
        `Category ${response.category.isActive ? "enabled" : "disabled"} successfully`
      );
    } catch (error) {
      const msg = handleApiError(error, "Failed to toggle status");
      toast.error(msg);
    }
  };

  const handleOpenDeleteModal = (id) => {
    setDeleteCategoryId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteCategoryId) return;
    
    try {
      setDeletionLoading(true);
      await deleteCategory(deleteCategoryId);
      setCategories((prev) => prev.filter((cat) => cat.id !== deleteCategoryId));
      toast.success("Category deleted successfully");
      setIsDeleteModalOpen(false);
    } catch (error) {
      const msg = handleApiError(error, "Failed to delete category");
      toast.error(msg);
    } finally {
      setDeletionLoading(false);
      setDeleteCategoryId(null);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, image: null });
      setImagePreview(category.media?.[0]?.url || null);
    } else {
      setEditingCategory(null);
      setFormData({ name: "", image: null });
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (submissionLoading) return; // Prevent closing while submitting
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: "", image: null });
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
    if (formData.image) {
      data.append("image", formData.image);
    }
    
    try {
      setSubmissionLoading(true);
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
        toast.success("Category updated successfully");
      } else {
        await createCategory(data);
        toast.success("Category created successfully");
      }
      fetchCategories();
      handleCloseModal();
    } catch (error) {
      const msg = handleApiError(error, "Form submission failed");
      toast.error(msg);
    } finally {
      setSubmissionLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: "Image",
      render: (cat) => (
        cat.media?.url ? (
          <img
            src={cat.media.url}
            alt={cat.name}
            className="w-12 h-12 rounded-lg object-cover bg-gray-100"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
            <Upload size={16} />
          </div>
        )
      )
    },
    {
      header: "Name",
      accessor: "name",
      className: "font-medium text-gray-900"
    },
    {
      header: "Status",
      render: (cat) => (
        <button
          onClick={() => handleToggleStatus(cat.id)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
            cat.isActive
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {cat.isActive ? (
            <ToggleRight size={16} />
          ) : (
            <ToggleLeft size={16} />
          )}
          {cat.isActive ? "Active" : "Disabled"}
        </button>
      )
    },
    {
      header: "Actions",
      className: "text-right",
      render: (cat) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleOpenModal(cat)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
            title="Edit"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => handleOpenDeleteModal(cat.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={filteredCategories}
        loading={loading}
        error={error}
        onRetry={fetchCategories}
        onSearch={setSearch}
        searchPlaceholder="Search categories..."
        emptyMessage="No categories found."
        actions={
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus size={20} /> Add Category
          </button>
        }
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCategory ? "Edit Category" : "Add New Category"}
        maxWidth="max-w-md"
      >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="e.g. Smartphones"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cover Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-indigo-500 transition-colors cursor-pointer relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
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
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submissionLoading}
                  className="flex-1 px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold shadow-lg shadow-indigo-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submissionLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {editingCategory ? "Saving..." : "Creating..."}
                    </>
                  ) : (
                    editingCategory ? "Update Category" : "Create Category"
                  )}
                </button>
              </div>
            </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deletionLoading}
      />
    </div>
  );
};

export default AdminCategories;
