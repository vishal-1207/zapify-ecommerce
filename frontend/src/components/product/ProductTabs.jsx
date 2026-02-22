import React, { useState } from "react";
import { formatCurrency } from "../../utils/currency";

const ProductTabs = ({ product }) => {
  const [activeTab, setActiveTab] = useState("description");

  const tabs = [
    { id: "description", label: "Description" },
    { id: "specs", label: "Specifications" },
    { id: "shipping", label: "Shipping & Returns" },
  ];

  return (
    <div className="mb-16">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 px-8 text-sm font-bold border-b-2 transition-colors duration-300 ${
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="text-gray-600 leading-relaxed">
        {activeTab === "description" && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Product Description
            </h3>
            <p className="mb-4">
              {product.description ||
                "No description available for this product."}
            </p>
          </div>
        )}

        {activeTab === "specs" && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Technical Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Common Fields */}
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="font-medium text-gray-900">Brand</span>
                <span>
                  {typeof product.brand === "object"
                    ? product.brand?.name
                    : product.brand || "N/A"}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="font-medium text-gray-900">Category</span>
                <span>
                  {typeof product.category === "object"
                    ? product.category?.name
                    : product.category || "N/A"}
                </span>
              </div>
              {product.model && (
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="font-medium text-gray-900">Model</span>
                  <span>{product.model}</span>
                </div>
              )}

              {/* Dynamic Specs from DB */}
              {product.specs && product.specs.length > 0 ? (
                product.specs.map((spec, index) => (
                  <div
                    key={index}
                    className="flex justify-between py-3 border-b border-gray-100"
                  >
                    <span className="font-medium text-gray-900">
                      {spec.key}
                    </span>
                    <span>{spec.value}</span>
                  </div>
                ))
              ) : (
                <div className="col-span-1 md:col-span-2 text-gray-500 italic py-4">
                  No additional specifications available.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "shipping" && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Shipping Information
            </h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Free standard shipping on all orders over {formatCurrency(500)}.
              </li>
              <li>
                Orders are processed and shipped within 1-2 business days.
              </li>
              <li>Expedited shipping options available at checkout.</li>
              <li>International shipping available to select countries.</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-900 mt-6 mb-4">
              Returns Policy
            </h3>
            <p>
              We offer a 30-day return policy for all unused items in their
              original packaging. Simply initiate a return from your account
              dashboard to receive a prepaid shipping label.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductTabs;
