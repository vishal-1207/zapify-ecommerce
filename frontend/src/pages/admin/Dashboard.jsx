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
import { Line, Pie, Bar } from "react-chartjs-2";
import { Package, Users, Star, ShoppingBag, IndianRupee } from "lucide-react";
import api from "../../api/axios";

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

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, salesRes, categoryRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/stats/sales-over-time?days=30"),
          api.get("/admin/stats/sales-by-category"),
        ]);

        setStats(statsRes.data.stats);
        setSalesData(salesRes.data.salesData);
        setCategoryData(categoryRes.data.categoryData);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`${formatCurrency(stats?.totalRevenue || 0)}`}
          icon={IndianRupee}
          color="bg-green-500"
        />
        <StatCard
          title="Total Sellers"
          value={stats?.totalSellers || 0}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Pending Products"
          value={stats?.pendingProducts || 0}
          icon={Package}
          color="bg-orange-500"
        />
        <StatCard
          title="Pending Reviews"
          value={stats?.pendingReviews || 0}
          icon={Star}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Sales Overview (Last 30 Days)</h3>
          {salesData && <Line data={salesData} options={{ responsive: true, maintainAspectRatio: false }} height={300} />}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Sales by Category</h3>
          {categoryData && <Pie data={categoryData} options={{ responsive: true, maintainAspectRatio: false }} height={300} />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
