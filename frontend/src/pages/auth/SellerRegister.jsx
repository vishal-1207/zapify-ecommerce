import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Building2, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { getCsrfToken } from "../../api/auth";

const SellerRegister = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth(); // We need to upgrade the user status locally
  const [formData, setFormData] = useState({
    storeName: "",
    contactNumber: "",
    bio: "",
    website: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch CSRF token on mount
  useEffect(() => {
    const fetchCsrf = async () => {
      try {
        const { csrfToken } = await getCsrfToken();
        if (csrfToken) {
          api.defaults.headers.common["X-CSRF-Token"] = csrfToken;
        }
      } catch (err) {
        console.error("Failed to fetch CSRF token", err);
      }
    };
    fetchCsrf();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Create seller profile
      await api.post("/seller/profile/register", formData);

      // 2. Refresh user context to pick up the new 'seller' role
      await refreshUser();

      // 3. Redirect to seller dashboard
      navigate("/seller/dashboard");
    } catch (err) {
        console.error("Seller registration failed", err);
        setError(err.response?.data?.message || "Failed to register seller profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-orange-500 p-3 rounded-2xl">
            <Briefcase className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-white">
          Become a Zapify Seller
        </h2>
        <p className="mt-2 text-slate-400">
          Start selling to millions of customers today.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow-2xl shadow-black/50 sm:rounded-lg sm:px-10 border border-slate-800">
          <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
            <Building2 className="text-blue-600 mt-0.5" size={20} />
            <div className="text-sm text-blue-800">
              <p className="font-bold">Professional Account</p>
              <p>
                Access to advanced analytics, bulk listing tools, and 24/7
                merchant support.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 flex items-start gap-3 rounded">
              <AlertCircle className="text-red-400 min-w-[20px]" size={20} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700">
                  Store Name
                </label>
                <input
                  type="text"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="e.g. Acme Electronics"
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-gray-700">
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-gray-700">
                  Website <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="https://example.com"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700">
                  Description / Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Tell us about your business..."
                />
              </div>
            </div>

            <div className="flex items-start">
              <input
                id="seller-terms"
                type="checkbox"
                required
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded mt-1"
              />
              <label
                htmlFor="seller-terms"
                className="ml-2 block text-sm text-gray-600"
              >
                I agree to the{" "}
                <Link to="/terms" className="text-orange-600 hover:underline">
                  Merchant Agreement
                </Link>{" "}
                and confirm I am authorized to act on behalf of the business.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition disabled:opacity-75"
            >
              {loading ? "Registering..." : "Register Business"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already selling on Zapify?{" "}
              <Link
                to="/login"
                className="font-medium text-orange-600 hover:text-orange-500"
              >
                Log in to Seller Central
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerRegister;
