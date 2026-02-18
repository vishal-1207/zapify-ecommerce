import React, { useEffect, useState } from "react";
import { formatCurrency } from "../../utils/currency";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Pie } from "react-chartjs-2";
import { Package, ShoppingCart, TrendingUp, IndianRupee, BarChart2 } from "lucide-react";
import {
  getSellerDashboardStats,
  getSellerSalesAnalytics,
  getSellerTopProducts,
  getSellerCategoryPerformance
} from "../../api/seller";
import { toast } from "react-hot-toast";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const SellerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [topProducts, setTopProducts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

    const fetchData = async () => {
    setLoading(true);
    try {
      // Use allSettled to allow partial loading of dashboard
      const results = await Promise.allSettled([
        getSellerDashboardStats(),
        getSellerSalesAnalytics(),
        getSellerCategoryPerformance(),
        getSellerTopProducts()
      ]);

      // Helper to extract value or null
      const getValue = (result) => result.status === 'fulfilled' ? result.value : null;

      const statsRes = getValue(results[0]);
      const salesRes = getValue(results[1]);
      const categoryRes = getValue(results[2]);
      const topProdRes = getValue(results[3]);

      // Check for errors to log, but don't blocking UI
      results.forEach((res, index) => {
          if (res.status === 'rejected') {
              console.error(`Dashboard API ${index} failed:`, res.reason);
              // Only toast if it's NOT a 404 (which might just mean "no profile" or similar in some APIs)
              // But generally, we suppress toast for partial data failure to avoid annoyance as requested.
          }
      });

      setStats(statsRes);
      
      // Process Sales Data for Chart
      if (salesRes && Array.isArray(salesRes)) {
         setSalesData({
             labels: salesRes.map(d => d.date || d.day),
             datasets: [
                 {
                     label: 'Sales (₹)',
                     data: salesRes.map(d => d.amount || d.totalRevenue), // Updated to match backend keys (totalRevenue)
                     borderColor: 'rgb(79, 70, 229)',
                     backgroundColor: 'rgba(79, 70, 229, 0.5)',
                     tension: 0.3
                 }
             ]
         });
      }

      // Process Category Data for Pie Chart
      if (categoryRes && Array.isArray(categoryRes)) {
           // Backend returns { labels: [], datasets: [] } structure for category performance? 
           // Wait, backend service `getSellerCategoryPerformance` returns: { labels: [...], datasets: [...] }
           // So categoryRes IS the chart data structure already!
           // Let's check api/seller.js: returns `response.data.categoryData`.
           // Backend service returns: { labels, datasets }.
           // So we can use it directly or map it if it was raw.
           
           // Actually, looking at backend service `getSellerCategoryPerformance` (lines 453), it returns the chart data object directly.
           // But `categoryRes` here is `response.data.categoryData`.
           // The code below tries to map it: `labels: categoryRes.map(...)`.
           // This interprets `categoryRes` as an ARRAY.
           // IF backend returns object, this map will FAIL.
           
           // DEBUG: Backend service line 453 returns an OBJECT `{ labels: [...], datasets: [...] }`.
           // Frontend `getSellerCategoryPerformance` returns `response.data.categoryData`.
           // Frontend `SellerDashboard` (original line 76) `if (categoryRes && Array.isArray(categoryRes))`.
           // This means the existing frontend Expects an ARRAY, but backend sends an OBJECT.
           // This is likely ANOTHER bug causing issues (though maybe not 500).
           
           // Fix: Use the object directly if it matches chart structure.
           if (categoryRes && categoryRes.labels) {
               setCategoryData(categoryRes);
           } else if (Array.isArray(categoryRes)) {
               // Fallback if it WAS an array (legacy?)
               setCategoryData({
                  labels: categoryRes.map(c => c.category),
                  datasets: [{
                      data: categoryRes.map(c => c.count || c.revenue),
                      // ...
                  }]
               });
           }
      }
      
      setTopProducts(topProdRes);

    } catch (error) {
      console.error("Critical dashboard error", error);
      // toast.error("Failed to load dashboard data"); // Suppressed as requested
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Seller Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue (30d)"
           value={`${formatCurrency(stats?.totalRevenue || 0)}`}
          icon={IndianRupee}
          color="bg-emerald-500"
        />
        <StatCard
          title="Orders (30d)"
          value={stats?.totalOrders || 0}
          icon={ShoppingCart}
          color="bg-blue-500"
        />
        <StatCard
          title="Items Sold (30d)"
          value={stats?.totalProductsSold || 0} // Adjusted key based on previous content
          icon={Package}
          color="bg-orange-500"
        />
        <StatCard
          title="Avg Rating"
          value={stats?.averageRating || "0.0"}
          icon={TrendingUp}
          color="bg-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Sales Performance</h3>
          <div className="h-[300px] flex items-center justify-center">
             {salesData ? (
                 <Line data={salesData} options={{ responsive: true, maintainAspectRatio: false }} />
             ) : (
                 <div className="text-gray-400 flex flex-col items-center">
                    <BarChart2 size={48} className="mb-2 opacity-50"/>
                    <p>No sales data available</p>
                 </div>
             )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Category Breakdown</h3>
          <div className="h-[300px] flex items-center justify-center">
             {categoryData ? (
                 <Pie data={categoryData} options={{ responsive: true, maintainAspectRatio: false }} />
             ) : (
                 <p className="text-gray-400">No category data available</p>
             )}
          </div>
        </div>
      </div>
      
      {/* Top Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-800">Top Performing Products</h3>
          </div>
          <div className="p-0">
             {topProducts && topProducts.length > 0 ? (
                 <table className="w-full text-left text-sm text-gray-600">
                     <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs">
                         <tr>
                             <th className="px-6 py-3">Product</th>
                             <th className="px-6 py-3">Sold</th>
                             <th className="px-6 py-3">Revenue</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                         {topProducts.map((product, idx) => (
                             <tr key={idx} className="hover:bg-gray-50">
                                 <td className="px-6 py-3 font-medium text-gray-800">{product.name}</td>
                                 <td className="px-6 py-3">{product.sold}</td>
                                  <td className="px-6 py-3 text-green-600 font-bold">{formatCurrency(product.revenue)}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             ) : (
                 <div className="p-8 text-center text-gray-500">No top products data found.</div>
             )}
          </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between transition hover:shadow-md">
    <div>
      <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
    <div className={`p-3 rounded-lg ${color} shadow-lg shadow-opacity-20`}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

export default SellerDashboard;
