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
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto scrollbar-hide whitespace-nowrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`cursor-pointer py-4 px-6 sm:px-8 text-sm font-bold border-b-2 transition-colors duration-300 flex-shrink-0 ${
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
            <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-4">
              Technical Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 text-sm sm:text-base">
              {/* Common Fields */}
              <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-gray-100 gap-1 sm:gap-4">
                <span className="font-semibold sm:font-medium text-gray-900 shrink-0">
                  Brand
                </span>
                <span className="text-gray-600 sm:text-gray-900">
                  {typeof product.brand === "object"
                    ? product.brand?.name
                    : product.brand || "N/A"}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-gray-100 gap-1 sm:gap-4">
                <span className="font-semibold sm:font-medium text-gray-900 shrink-0">
                  Category
                </span>
                <span className="text-gray-600 sm:text-gray-900">
                  {typeof product.category === "object"
                    ? product.category?.name
                    : product.category || "N/A"}
                </span>
              </div>
              {product.model && (
                <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-gray-100 gap-1 sm:gap-4">
                  <span className="font-semibold sm:font-medium text-gray-900 shrink-0">
                    Model
                  </span>
                  <span className="text-gray-600 sm:text-gray-900">
                    {product.model}
                  </span>
                </div>
              )}

              {/* Dynamic Specs from DB */}
              {product.specs && product.specs.length > 0 ? (
                product.specs.map((spec, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-gray-100 gap-1 sm:gap-4"
                  >
                    <span className="font-semibold sm:font-medium text-gray-900 shrink-0">
                      {spec.key}
                    </span>
                    <span className="text-gray-600 sm:text-gray-900">
                      {spec.value}
                    </span>
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
