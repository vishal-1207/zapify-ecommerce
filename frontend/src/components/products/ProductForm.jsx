import React, { useState, useEffect } from "react";
import {
  Upload,
  X,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { CURRENCY_SYMBOL } from "../../utils/currency";

const ProductForm = ({
  initialData,
  categories = [],
  brands = [],
  onSubmit,
  onCancel,
  isLoading,
  title, // Optional title override
  showStock = true,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    name: "",
    model: "",
    description: "",
    price: "",
    totalOfferStock: "",
    categoryId: "",
    brandId: "",
    thumbnail: null,
    gallery: [],
    specs: [],
    mediaToDelete: [],
  });

  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [galleryPreview, setGalleryPreview] = useState([]);

  // Initialize form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        model: initialData.model || "",
        description: initialData.description || "",
        price: initialData.price || "",
        totalOfferStock: initialData.totalOfferStock || 0,
        categoryId: initialData.categoryId || "",
        brandId: initialData.brandId || "",
        thumbnail: null,
        gallery: [],
        specs: initialData.specs || [],
        mediaToDelete: [],
      });

      // Handle Thumbnail Preview
      const thumb = initialData.media?.find((m) => m.tag === "thumbnail");
      setThumbnailPreview(thumb ? thumb.url : null);

      // Handle Gallery Preview
      const existingGallery =
        initialData.media
          ?.filter((m) => m.tag === "gallery")
          .map((m) => ({
            url: m.url,
            isExisting: true,
            id: m.id,
          })) || [];
      setGalleryPreview(existingGallery);
      setCurrentStep(1);
    } else {
      // Reset logic for creating new product
      setFormData({
        name: "",
        model: "",
        description: "",
        price: "",
        totalOfferStock: "",
        categoryId: "",
        brandId: "",
        thumbnail: null,
        gallery: [],
        specs: [{ key: "", value: "" }],
        mediaToDelete: [],
      });
      setThumbnailPreview(null);
      setGalleryPreview([]);
      setCurrentStep(1);
    }
  }, [initialData]);

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, thumbnail: file });
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        gallery: [...prev.gallery, ...files],
      }));

      const newPreviews = files.map((file) => ({
        url: URL.createObjectURL(file),
        isExisting: false,
        file: file,
      }));
      setGalleryPreview((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveGalleryImage = (index) => {
    const itemToRemove = galleryPreview[index];
    const newPreviews = galleryPreview.filter((_, i) => i !== index);
    setGalleryPreview(newPreviews);

    if (itemToRemove.isExisting) {
      setFormData((prev) => ({
        ...prev,
        mediaToDelete: [...prev.mediaToDelete, itemToRemove.id],
      }));
    } else {
      if (itemToRemove.file) {
        setFormData((prev) => ({
          ...prev,
          gallery: prev.gallery.filter((f) => f !== itemToRemove.file),
        }));
      }
    }
  };

  const handleAddSpec = () => {
    setFormData({
      ...formData,
      specs: [...formData.specs, { key: "", value: "" }],
    });
  };

  const handleRemoveSpec = (index) => {
    const newSpecs = formData.specs.filter((_, i) => i !== index);
    setFormData({ ...formData, specs: newSpecs });
  };

  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...formData.specs];
    newSpecs[index][field] = value;
    setFormData({ ...formData, specs: newSpecs });
  };

  const nextStep = () => {
    if (!formData.name || !formData.price || !formData.categoryId) {
      toast.error("Please fill in all required fields (Name, Price, Category)");
      return;
    }
    setCurrentStep(2);
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    if (formData.model) data.append("model", formData.model);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("totalOfferStock", formData.totalOfferStock);
    if (formData.categoryId) data.append("categoryId", formData.categoryId);
    if (formData.brandId) data.append("brandId", formData.brandId);

    const validSpecs = formData.specs.filter(
      (s) => s.key.trim() !== "" && s.value.trim() !== "",
    );
    data.append("specs", JSON.stringify(validSpecs));

    if (formData.thumbnail) {
      data.append("thumbnail", formData.thumbnail);
    }

    if (formData.gallery && formData.gallery.length > 0) {
      formData.gallery.forEach((file) => {
        data.append("gallery", file);
      });
    }

    if (formData.mediaToDelete && formData.mediaToDelete.length > 0) {
      data.append("mediaToDelete", JSON.stringify(formData.mediaToDelete));
    }

    onSubmit(data);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Steps Indicator */}
      <div className="pb-6 border-b border-gray-100 flex gap-2 shrink-0 mb-6">
        <div
          className={`h-1 flex-1 rounded-full ${
            currentStep >= 1 ? "bg-indigo-600" : "bg-gray-200"
          }`}
        ></div>
        <div
          className={`h-1 flex-1 rounded-full ${
            currentStep >= 2 ? "bg-indigo-600" : "bg-gray-200"
          }`}
        ></div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 flex-1 overflow-y-auto px-1"
      >
        {currentStep === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Name */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                placeholder="e.g. Wireless Headphones"
              />
            </div>

            {/* Model */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model{" "}
                <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                placeholder="e.g. WH-1000XM4"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ({CURRENCY_SYMBOL}){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                placeholder="0.00"
              />
            </div>

            {/* Stock */}
            {showStock && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={formData.totalOfferStock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalOfferStock: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="0"
                />
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <select
                value={formData.brandId}
                onChange={(e) =>
                  setFormData({ ...formData, brandId: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
              >
                <option value="">Select Brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows="4"
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                placeholder="Product description..."
              ></textarea>
            </div>

            {/* Thumbnail */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Thumbnail
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-indigo-500 transition-colors cursor-pointer relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    alt="Preview"
                    className="h-48 object-contain rounded-lg shadow-sm"
                  />
                ) : (
                  <>
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-indigo-100 transition">
                      <Upload size={24} />
                    </div>
                    <p className="text-sm text-gray-500">
                      Click to upload thumbnail
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      SVG, PNG, JPG (max. 800x400px)
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Gallery */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Gallery
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {galleryPreview.map((item, index) => (
                  <div
                    key={index}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200"
                  >
                    <img
                      src={item.url}
                      alt={`Gallery ${index}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(index)}
                      className="absolute top-2 right-2 p-1 bg-white/90 text-red-600 rounded-full shadow-sm hover:bg-white transition opacity-0 group-hover:opacity-100"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}

                <div className="relative aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-center hover:border-indigo-500 transition-colors cursor-pointer bg-gray-50/50">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Plus size={24} className="text-gray-400 mb-2" />
                  <span className="text-xs text-gray-500">Add Images</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-lg font-semibold text-gray-800">
                Specifications
              </h4>
              <button
                type="button"
                onClick={handleAddSpec}
                className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
              >
                <Plus size={16} /> Add Spec
              </button>
            </div>

            {/* Added py-1 and px-1 to container to prevent focus ring/border from being cut off by overflow */}
            <div className="py-1 px-1">
              {formData.specs.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-500">
                  No specifications added yet. click "Add Spec" to start.
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.specs.map((spec, index) => (
                    <div key={index} className="flex items-center gap-3 group">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Key (e.g. Color)"
                          value={spec.key}
                          onChange={(e) =>
                            handleSpecChange(index, "key", e.target.value)
                          }
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Value (e.g. Black)"
                          value={spec.value}
                          onChange={(e) =>
                            handleSpecChange(index, "value", e.target.value)
                          }
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(index)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </form>

      <div className="pt-6 border-t border-gray-100 flex justify-end gap-3 mt-6 bg-white shrink-0 z-10">
        {onCancel && currentStep === 1 && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition"
          >
            Cancel
          </button>
        )}

        {currentStep === 2 && (
          <button
            type="button"
            onClick={prevStep}
            className="flex items-center gap-2 px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition"
          >
            <ArrowLeft size={18} /> Back
          </button>
        )}

        {currentStep === 1 ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition"
          >
            Next <ArrowRight size={18} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg shadow-green-200 transition flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span>Saving...</span>
                <Loader2 size={18} className="animate-spin" />
              </>
            ) : (
              <>
                <span>
                  {title || (isEditing ? "Update Product" : "Create Product")}
                </span>
                <CheckCircle size={18} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductForm;
