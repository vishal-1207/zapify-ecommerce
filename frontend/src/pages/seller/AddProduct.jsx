import React, { useState } from "react";
import { Search, Plus, Package, AlertCircle, ArrowRight } from "lucide-react";
import { createOffer } from "../../api/offers";
import { suggestNewProduct } from "../../api/seller";
import { getAllCategories } from "../../api/categories";
import { getAllBrands } from "../../api/brands";
import Modal from "../../components/common/Modal";
import OfferForm from "../../components/offers/OfferForm";
import ProductForm from "../../components/products/ProductForm";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { liteClient } from "algoliasearch/lite";
import { InstantSearch, Configure, useHits, useSearchBox } from "react-instantsearch";

const searchClient = liteClient(
  import.meta.env.VITE_ALGOLIA_APP_ID,
  import.meta.env.VITE_ALGOLIA_SEARCH_KEY
);

const AddProductValues = ({ 
    onSellYours, 
    onCreateNew,
    isSearching 
}) => {
    const { hits } = useHits();
    const { query, refine } = useSearchBox();

    return (
        <>
            {/* Search Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                    />
                    <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    placeholder="Search by product name, model, UPC, EAN, or ISBN..."
                    value={query}
                    onChange={(e) => refine(e.target.value)}
                    />
                </div>
                {/* Search button removed as it's instant, but we can keep for layout if desired or remove */}
                </div>
            </div>

            {/* Results Section */}
            {query.length > 0 && (
                <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Search Results</h3>
                    <button 
                        onClick={onCreateNew}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                    >
                        Product not found? Create a new listing <ArrowRight size={16}/>
                    </button>
                </div>
                
                {hits.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-300">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">
                        No products found
                    </h3>
                    <p className="text-gray-500 mt-1 mb-6">
                        We couldn't find any products matching "{query}".
                    </p>
                    <button
                        onClick={onCreateNew}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition shadow-sm"
                    >
                        <Plus size={18} /> Create a new product listing
                    </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                    {hits.map((product) => (
                        <div
                        key={product.objectID}
                        className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-4 hover:shadow-md transition"
                        >
                        <div className="w-16 h-16 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                            {product.image ? (
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                            ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package size={24} />
                            </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">
                            {product.name}
                            </h4>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span>Brand: {product.brand}</span>
                            <span>Category: {product.category}</span>
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">
                                {product.inStock ? "In Stock" : "Out of Stock"}
                            </span>
                            </div>
                        </div>
                        <button
                            onClick={() => onSellYours(product)}
                            className="shrink-0 px-4 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition whitespace-nowrap"
                        >
                            Sell this product
                        </button>
                        </div>
                    ))}
                    </div>
                )}
                </div>
            )}
        </>
    );
};

const AddProduct = () => {  
  // Modal States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data for Create New
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSellYours = (product) => {
    // Algolia returns objectID, but we use ID in backend. 
    // Usually they are mapped 1:1, but worth ensuring id property exists
    setSelectedProduct({ ...product, id: product.objectID });
    setIsOfferModalOpen(true);
  };

  const handleCreateNew = async () => {
      // Fetch dependencies if not loaded
      if (categories.length === 0) {
          try {
              const [cats, brnds] = await Promise.all([getAllCategories(), getAllBrands()]);
              setCategories(cats);
              setBrands(brnds);
          } catch (e) {
              console.error("Failed to load form data", e);
              toast.error("Failed to load form data");
              return;
          }
      }
      setIsProductModalOpen(true);
  };

  const submitOffer = async (offerData) => {
      setIsSubmitting(true);
      try {
          await createOffer(offerData.productId, offerData);
          toast.success("Offer listed successfully!");
          setIsOfferModalOpen(false);
          // navigate("/seller/products"); // Optional: redirect to list
      } catch (error) {
          console.error("Failed to create offer", error);
          toast.error(error.response?.data?.message || "Failed to list offer");
      } finally {
          setIsSubmitting(false);
      }
  };

  const submitNewProduct = async (formData) => {
      if (!user || !user.id) {
          toast.error("User identification failed");
          return;
      }
      setIsSubmitting(true);
      try {
          await suggestNewProduct("current", formData);
          toast.success("Product request submitted successfully!");
          setIsProductModalOpen(false);
          navigate("/seller/products");
      } catch (error) {
          console.error("Failed to submit product", error);
          toast.error(error.response?.data?.message || "Submission failed");
      } finally {
          setIsSubmitting(false);
      }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Add a Product</h2>
        <p className="text-gray-500">
          Find the product you want to sell in Zapify's catalog.
        </p>
      </div>

      <InstantSearch 
        searchClient={searchClient} 
        indexName="products"
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <Configure filters="status:approved" />
        <AddProductValues 
            onSellYours={handleSellYours} 
            onCreateNew={handleCreateNew} 
        />
      </InstantSearch>

      {/* Offer Modal */}
      <Modal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        title="Listing Details"
        maxWidth="max-w-lg"
      >
          {selectedProduct && (
              <OfferForm 
                 product={selectedProduct}
                 onSubmit={submitOffer}
                 onCancel={() => setIsOfferModalOpen(false)}
                 isLoading={isSubmitting}
              />
          )}
      </Modal>

      {/* Product Modal (Create New) */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Create New Product"
        maxWidth="max-w-4xl"
      >
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800 flex gap-2 items-start">
              <AlertCircle size={18} className="shrink-0 mt-0.5"/>
              <div>
                  <strong>Important:</strong> You are creating a new product in the Zapify catalog. 
                  Please double-check that this product does not already exist to avoid duplicates.
                  Your submission will be reviewed by our team.
              </div>
          </div>
          <ProductForm 
              categories={categories}
              brands={brands}
              onSubmit={submitNewProduct}
              onCancel={() => setIsProductModalOpen(false)}
              isLoading={isSubmitting}
              title="Submit for Review"
          />
      </Modal>

    </div>
  );
};

export default AddProduct;
