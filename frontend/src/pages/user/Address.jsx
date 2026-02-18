import React, { useState, useEffect } from "react";
import { MapPin, Plus, Trash, Edit2, AlertCircle } from "lucide-react";
import { Country, State, City } from "country-state-city";
import {
  getUserAddresses,
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
} from "../../api/address";
import { toast } from "react-hot-toast";

const Address = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initialAddressState = {
    street: "",
    details: "",
    city: "",
    state: "",
    zipCode: "",
    country: "IN",
  };

  const [formData, setFormData] = useState(initialAddressState);
  const [errors, setErrors] = useState({});

  const fetchAddresses = async () => {
    try {
      const data = await getUserAddresses();
      setAddresses(data || []);
    } catch (err) {
      console.error("Failed to load addresses", err);
      toast.error("Failed to load your addresses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const resetForm = () => {
    setFormData(initialAddressState);
    setErrors({});
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (addr) => {
    setFormData({
      street: addr.street,
      details: addr.details?.landmark || "",
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      country: "IN",
    });
    setErrors({});
    setEditingId(addr.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.street || formData.street.length < 5) {
      newErrors.street = "Street address must be at least 5 characters.";
    }

    if (!formData.city || formData.city.length < 2) {
      newErrors.city = "City must be valid.";
    }

    if (!formData.state || formData.state.length < 2) {
      newErrors.state = "State must be valid.";
    }

    const zipRegex = /^\d{6}$/;
    if (!formData.zipCode || !zipRegex.test(formData.zipCode)) {
      newErrors.zipCode = "Please enter a valid 6-digit PIN code.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors in the form.");
      return;
    }

    const payload = {
      ...formData,
      details: { landmark: formData.details },
    };
    delete payload.details.landmark.details;
    const apiPayload = {
      street: formData.street,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      country: formData.country,
      details: { landmark: formData.details },
    };

    try {
      if (editingId) {
        await updateUserAddress(editingId, apiPayload);
        toast.success("Address updated successfully!");
      } else {
        await createUserAddress(apiPayload);
        toast.success("Address added successfully!");
      }
      fetchAddresses();
      resetForm();
    } catch (err) {
      console.error("Failed to save address", err);
      toast.error("Failed to save address. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;
    try {
      await deleteUserAddress(id);
      fetchAddresses();
      toast.success("Address deleted.");
    } catch (err) {
      console.error("Failed to delete", err);
      toast.error("Failed to delete address.");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Addresses</h2>
          <p className="text-sm text-gray-500">Manage shipping addresses</p>
        </div>
        {!isFormOpen && (
          <button
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm font-bold bg-indigo-50 px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} /> Add New
          </button>
        )}
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 p-6 rounded-lg mb-8 border border-indigo-100 shadow-sm"
        >
          <h3 className="font-bold text-gray-800 mb-4">
            {editingId ? "Edit Address" : "Add New Address"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                placeholder="123 Main St"
                className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${errors.street ? "border-red-300 ring-1 ring-red-300" : "border-gray-300"}`}
                value={formData.street}
                onChange={(e) =>
                  setFormData({ ...formData, street: e.target.value })
                }
              />
              {errors.street && (
                <p className="text-red-500 text-xs mt-1">{errors.street}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apartment, suite, etc. (optional)
              </label>
              <input
                placeholder="Apartment 4B, Near Central Park"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                value={formData.details}
                onChange={(e) =>
                  setFormData({ ...formData, details: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <select
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50"
                value={formData.country}
                disabled
              >
                <option value="IN">India</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${errors.state ? "border-red-300 ring-1 ring-red-300" : "border-gray-300"}`}
                value={formData.state}
                onChange={(e) => {
                  setFormData({ ...formData, state: e.target.value, city: "" });
                }}
                required
              >
                <option value="">Select State</option>
                {State.getStatesOfCountry("IN").map((state) => (
                  <option key={state.isoCode} value={state.isoCode}>
                    {state.name}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="text-red-500 text-xs mt-1">{errors.state}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <select
                className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${errors.city ? "border-red-300 ring-1 ring-red-300" : "border-gray-300"}`}
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                required
                disabled={!formData.state}
              >
                <option value="">Select City</option>
                {formData.state &&
                  City.getCitiesOfState("IN", formData.state).map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
              </select>
              {errors.city && (
                <p className="text-red-500 text-xs mt-1">{errors.city}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ZIP / Postal Code
              </label>
              <input
                placeholder="100001"
                maxLength={6}
                className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${errors.zipCode ? "border-red-300 ring-1 ring-red-300" : "border-gray-300"}`}
                value={formData.zipCode}
                onChange={(e) =>
                  // Only allow numbers
                  {
                    const val = e.target.value;
                    if (val === "" || /^\d+$/.test(val)) {
                      setFormData({ ...formData, zipCode: val });
                    }
                  }
                }
              />
              {errors.zipCode && (
                <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>
              )}
            </div>
          </div>
          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-transform transform active:scale-95"
            >
              {editingId ? "Update Address" : "Save Address"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {addresses.length === 0 && !isFormOpen ? (
          <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg">
            <MapPin className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">
              No addresses saved
            </h3>
            <p className="text-gray-500 mb-6">
              Add a shipping address to speed up checkout.
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus size={16} className="mr-2" /> Add Address
            </button>
          </div>
        ) : (
          addresses.map((addr) => (
            <div
              key={addr.id}
              className={`border rounded-lg p-4 flex justify-between items-start transition-all group ${
                editingId === addr.id
                  ? "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-indigo-300"
              }`}
            >
              <div className="flex gap-4">
                <div className="mt-1 bg-indigo-50 p-2 rounded-full shrink-0 h-9 w-9 flex items-center justify-center">
                  <MapPin className="text-indigo-600" size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{addr.street}</p>
                  {addr.details?.landmark && (
                    <p className="text-sm text-gray-600">
                      {addr.details.landmark}
                    </p>
                  )}
                  <p className="text-gray-600">
                    {addr.city}, {addr.state} -{" "}
                    <span className="font-medium text-gray-800">
                      {addr.zipCode}
                    </span>
                  </p>
                  <p className="text-gray-500 text-xs mt-1 uppercase tracking-wide">
                    {addr.country}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(addr)}
                  className="text-gray-400 hover:text-indigo-600 p-2 rounded-md hover:bg-indigo-50 transition-colors"
                  title="Edit Address"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="text-gray-400 hover:text-red-500 p-2 rounded-md hover:bg-red-50 transition-colors"
                  title="Delete Address"
                >
                  <Trash size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Address;
