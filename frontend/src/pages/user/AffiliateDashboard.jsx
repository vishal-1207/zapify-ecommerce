import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  applyForAffiliate,
  getAffiliateDashboard,
  getAffiliateOrders,
} from "../../api/affiliate";
import { formatCurrency } from "../../utils/currency";
import { TrendingUp, Copy, DollarSign, PackageOpen, Award } from "lucide-react";

const AffiliateDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await getAffiliateDashboard();
      if (data && data.profile) {
        setProfile(data.profile);
        setStats(data.stats);
        
        const ordersData = await getAffiliateOrders();
        setOrders(ordersData);
      }
    } catch (error) {
      if (error?.response?.status === 404 || error?.response?.data?.message?.includes("not found")) {
        setProfile(null);
      } else {
        toast.error("Failed to load dashboard data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const data = await applyForAffiliate();
      if (data.profile) {
        toast.success("Welcome to the Affiliate Program!");
        fetchDashboard();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  const copyToClipboard = () => {
    const link = `${window.location.origin}/?ref=${profile.referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Affiliate link copied!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-20 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-6">
            <Award size={40} />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Join the Affiliate Program</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Turn your audience into income. Share Zapify with your network and earn a flat 10% commission on every qualifying purchase they make using your unique link.
          </p>
          <button
            onClick={handleApply}
            disabled={applying}
            className="bg-indigo-600 text-white font-bold text-xl px-12 py-5 rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all disabled:opacity-70"
          >
            {applying ? "Setting up your account..." : "Become an Affiliate Today"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Affiliate Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Status: <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">{profile.status}</span>
            </p>
          </div>
          <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
            <div className="px-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-600 truncate max-w-[200px] sm:max-w-sm font-mono border border-gray-100">
              {window.location.origin}/?ref={profile.referralCode}
            </div>
            <button 
              onClick={copyToClipboard}
              className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium px-4 transition"
            >
              <Copy size={18} /> Copy Link
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 opacity-50"></div>
            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <TrendingUp size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Earned</p>
              <h3 className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.totalEarnings || 0)}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-10 opacity-50"></div>
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
              <DollarSign size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Pending Payouts</p>
              <h3 className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.pendingEarnings || 0)}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 opacity-50"></div>
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <PackageOpen size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Referred Orders</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats?.totalReferredOrders || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Recent Conversions</h3>
          </div>
          <div className="overflow-x-auto">
            {orders.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <PackageOpen size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-lg font-medium">No conversions yet</p>
                <p className="text-sm">Share your link to generate your first sale!</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Value</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Commission Earned</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                        {order.uniqueOrderId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(order.subtotalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        +{formatCurrency(order.affiliateCommission)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'cancelled' || order.status === 'return_requested' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateDashboard;
