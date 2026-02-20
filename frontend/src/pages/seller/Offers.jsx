import React, { useState, useEffect } from "react";
import { getMyOffers, updateOffer } from "../../api/offers";
import { createSellerDeal } from "../../api/discounts";
import { formatCurrency } from "../../utils/currency";
import { Edit, Trash2, Tag, X, Check, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [dealForm, setDealForm] = useState({
    dealPrice: "",
    dealStartDate: "",
    dealEndDate: "",
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const data = await getMyOffers();
      setOffers(data || []);
    } catch (error) {
      console.error("Failed to fetch offers", error);
      toast.error("Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDealModal = (offer) => {
    setSelectedOffer(offer);

    // Format dates for datetime-local input (YYYY-MM-DDThh:mm)
    const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    };

    setDealForm({
      dealPrice: offer.dealPrice || "",
      dealStartDate: formatDate(offer.dealStartDate),
      dealEndDate: formatDate(offer.dealEndDate),
    });
    setIsDealModalOpen(true);
  };

  const handleDealSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOffer) return;

    if (parseFloat(dealForm.dealPrice) >= parseFloat(selectedOffer.price)) {
      toast.error("Deal price must be lower than the regular price");
      return;
    }

    try {
      const updatedData = {
        dealPrice: dealForm.dealPrice || null,
        dealStartDate: dealForm.dealStartDate
          ? new Date(dealForm.dealStartDate).toISOString()
          : null,
        dealEndDate: dealForm.dealEndDate
          ? new Date(dealForm.dealEndDate).toISOString()
          : null,
      };

      await createSellerDeal(selectedOffer.id, updatedData);

      // Update local state
      setOffers(
        offers.map((o) =>
          o.id === selectedOffer.id ? { ...o, ...updatedData } : o,
        ),
      );

      toast.success("Deal updated successfully");
      setIsDealModalOpen(false);
    } catch (error) {
      console.error("Failed to update deal", error);
      toast.error("Failed to update deal");
    }
  };

  const isDealActive = (offer) => {
    if (!offer.dealPrice || !offer.dealStartDate || !offer.dealEndDate)
      return false;
    const now = new Date();
    const start = new Date(offer.dealStartDate);
    const end = new Date(offer.dealEndDate);
    return now >= start && now <= end;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Offers</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
          Create New Offer
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active Deal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {offers.map((offer) => (
              <tr key={offer.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <img
                        className="h-10 w-10 rounded-md object-cover"
                        src={
                          offer.product?.media?.[0]?.url ||
                          "https://placehold.co/100"
                        }
                        alt=""
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {offer.product?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {offer.condition}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-medium">
                    {formatCurrency(offer.price)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`text-sm ${offer.stockQuantity > 0 ? "text-green-600" : "text-red-500"}`}
                  >
                    {offer.stockQuantity} units
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isDealActive(offer) ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      On Deal: {formatCurrency(offer.dealPrice)}
                    </span>
                  ) : offer.dealPrice &&
                    new Date(offer.dealStartDate) > new Date() ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Scheduled
                    </span>
                  ) : offer.dealPrice &&
                    new Date(offer.dealEndDate) < new Date() ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Ended
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      offer.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {offer.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleOpenDealModal(offer)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4 flex items-center gap-1 inline-flex"
                    title="Manage Deal"
                  >
                    <Tag size={16} /> Deal
                  </button>
                  <button
                    className="text-gray-400 hover:text-gray-600"
                    title="Edit Offer"
                  >
                    <Edit size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deal Management Modal */}
      {isDealModalOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flexjustify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Manage Lightning Deal
              </h2>
            </div>

            <form onSubmit={handleDealSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Regular Price
                </label>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(selectedOffer?.price)}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deal Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={dealForm.dealPrice}
                  onChange={(e) =>
                    setDealForm({ ...dealForm, dealPrice: e.target.value })
                  }
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border"
                  placeholder="Enter discounted price"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be lower than regular price
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={dealForm.dealStartDate}
                    onChange={(e) =>
                      setDealForm({
                        ...dealForm,
                        dealStartDate: e.target.value,
                      })
                    }
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={dealForm.dealEndDate}
                    onChange={(e) =>
                      setDealForm({ ...dealForm, dealEndDate: e.target.value })
                    }
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 border text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDealModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Offers;
