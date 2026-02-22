import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { getUserAddresses, createUserAddress } from "../../api/address";
import { toast } from "react-hot-toast";
import { Plus, Check, MapPin, Truck } from "lucide-react";
import { formatCurrency } from "../../utils/currency";

const Checkout = () => {
  const { cart, cartTotal, cartMrpTotal, cartSellerPriceTotal, cartDiscount } =
    useCart();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // New Address Form State
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "USA",
    isDefault: false,
  });

  useEffect(() => {
    if (cart.length === 0) {
      navigate("/cart");
      return;
    }
    fetchAddresses();
  }, [cart, navigate]);

  const fetchAddresses = async () => {
    try {
      const data = await getUserAddresses();
      setAddresses(data);
      const defaultAddr = data.find((a) => a.isDefault) || data[0];
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
    } catch (error) {
      console.error("Failed to load addresses", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const created = await createUserAddress(newAddress);
      setAddresses([...addresses, created]);
      setSelectedAddressId(created.id);
      setShowAddForm(false);
      setNewAddress({
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "USA",
        isDefault: false,
      });
      toast.success("Address added successfully");
    } catch (error) {
      toast.error("Failed to add address");
    }
  };

  const handleProceedToPayment = () => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }
    navigate("/payment", { state: { addressId: selectedAddressId } });
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3 space-y-8">
          {/* Address Section */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="text-indigo-600" /> Delivery Address
              </h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-indigo-600 font-medium hover:underline flex items-center gap-1"
              >
                <Plus size={16} /> Add New
              </button>
            </div>

            {showAddForm && (
              <form
                onSubmit={handleAddAddress}
                className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Street Address"
                    required
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newAddress.street}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, street: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="City"
                    required
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newAddress.city}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, city: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="State"
                    required
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newAddress.state}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, state: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Zip Code"
                    required
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newAddress.zipCode}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, zipCode: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedAddressId === addr.id
                      ? "border-indigo-600 bg-indigo-50/50"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-gray-800">{addr.street}</div>
                    {selectedAddressId === addr.id && <CheckCircleIcon />}
                  </div>
                  <div className="text-sm text-gray-600">
                    {addr.city}, {addr.state} {addr.zipCode}
                    <br />
                    {addr.country}
                  </div>
                </div>
              ))}
              {addresses.length === 0 && !showAddForm && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No addresses found. Please add one.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary Side */}
        <div className="lg:w-1/3">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Order Summary
            </h2>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>MRP Total</span>
                <span>{formatCurrency(cartMrpTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Selling Price</span>
                <span>{formatCurrency(cartSellerPriceTotal)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Total Discount</span>
                  <span>-{formatCurrency(cartDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600 font-bold">Free</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax Estimate</span>
                <span>{formatCurrency(cartTotal * 0.08)}</span>
              </div>
              <div className="h-px bg-gray-100 my-4"></div>
              <div className="flex justify-between text-xl font-bold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(cartTotal * 1.08)}</span>
              </div>
            </div>
            <button
              onClick={handleProceedToPayment}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckCircleIcon = () => (
  <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white">
    <Check size={12} strokeWidth={3} />
  </div>
);

export default Checkout;
