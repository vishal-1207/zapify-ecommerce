import { useEffect, useState, useCallback } from "react";
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
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Package,
  IndianRupee,
  TrendingUp,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Clock,
  Store,
  AlertCircle,
  Star,
  Activity,
  Minus,
} from "lucide-react";
import {
  getSellerDashboardStats,
  getSellerSalesAnalytics,
  getSellerTopProducts,
  getSellerCategoryPerformance,
  getSellerRecentOrders,
} from "../../api/seller";
import { Link } from "react-router-dom";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
);

const STATUS_CONFIG = {
  pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending" },
  processed: { bg: "bg-blue-100", text: "text-blue-700", label: "Processing" },
  shipped: { bg: "bg-indigo-100", text: "text-indigo-700", label: "Shipped" },
  delivered: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    label: "Delivered",
  },
  cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
};

const TrendChip = ({ value }) => {
  if (value === null || value === undefined) return null;
  const isPositive = value >= 0;
  const isZero = value === 0;
  if (isZero)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
        <Minus size={12} /> 0%
      </span>
    );
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${isPositive ? "text-emerald-600" : "text-red-500"}`}
    >
      {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
};

// eslint-disable-next-line no-unused-vars
const StatCard = ({ title, value, icon: Icon, gradient, trend, sub }) => (
  <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-3">
    <div className="flex items-start justify-between">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${gradient}`}
      >
        <Icon size={22} className="text-white" />
      </div>
      {trend !== undefined && <TrendChip value={trend} />}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{value}</h3>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
    {/* decorative corner blob */}
    <div
      className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-10 ${gradient}`}
    />
  </div>
);

// eslint-disable-next-line no-unused-vars
const SectionHeader = ({ icon: Icon, title, sub }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
      <Icon size={16} className="text-indigo-600" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  </div>
);

const ChartCard = ({ title, sub, icon: Icon, children, className = "" }) => (
  <div
    className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}
  >
    <SectionHeader icon={Icon} title={title} sub={sub} />
    <div className="relative">{children}</div>
  </div>
);

const PeriodSelector = ({ value, onChange }) => (
  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
    {[7, 30, 90].map((d) => (
      <button
        key={d}
        onClick={() => onChange(d)}
        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
          value === d
            ? "bg-white text-indigo-600 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        {d}d
      </button>
    ))}
  </div>
);

const Skeleton = ({ className }) => (
  <div className={`bg-gray-100 animate-pulse rounded-xl ${className}`} />
);

const lineChartOptions = (yLabel = "₹") => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: {
      display: true,
      position: "top",
      labels: { boxWidth: 10, font: { size: 11 } },
    },
    tooltip: {
      callbacks: {
        label: (ctx) =>
          yLabel === "₹" && ctx.datasetIndex === 0 // Revenue is index 0
            ? `  ${ctx.dataset.label}: ₹${Number(ctx.raw).toLocaleString("en-IN")}`
            : `  ${ctx.dataset.label}: ${ctx.raw}`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: {
      grid: { color: "rgba(0,0,0,0.04)" },
      ticks: {
        font: { size: 10 },
        callback: (v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v),
      },
    },
  },
});

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "right",
      labels: { boxWidth: 10, font: { size: 11 }, padding: 10 },
    },
  },
  cutout: "65%",
};

const SellerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, salesRes, categoryRes, topProdRes, recentRes] =
        await Promise.all([
          getSellerDashboardStats(days),
          getSellerSalesAnalytics(days),
          getSellerCategoryPerformance(days),
          getSellerTopProducts(days),
          getSellerRecentOrders(8),
        ]);

      setStats(statsRes);

      if (salesRes && salesRes.labels) {
        setSalesData({
          labels: salesRes.labels,
          datasets: [
            {
              ...salesRes.datasets[0], // Revenue
              fill: true,
              backgroundColor: "rgba(79, 70, 229, 0.1)",
              borderColor: "rgb(79, 70, 229)",
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 2,
            },
            {
              ...salesRes.datasets[1], // Orders
              borderColor: "rgb(245, 158, 11)",
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 2,
            },
            {
              ...salesRes.datasets[2], // Items Sold
              borderColor: "rgb(16, 185, 129)",
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 2,
            },
          ],
        });
      }

      setCategoryData(categoryRes);
      setTopProducts(topProdRes || []);
      setRecentOrders(recentRes || []);
    } catch (error) {
      console.error("Dashboard error", error);
    }
  }, [days]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const s = stats || {};

  return (
    <div className="space-y-6">
      {/* ─── Header Navigation ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor your store's sales, fulfillment, and revenue growth.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector value={days} onChange={setDays} />
          <button
            onClick={handleRefresh}
            className="p-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ─── Stats Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))
        ) : (
          <>
            <StatCard
              title="Total Revenue"
              value={formatCurrency(s.totalRevenue || 0)}
              icon={IndianRupee}
              gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
              trend={s.revenueGrowth}
              sub={`vs previous ${days}d`}
            />
            <StatCard
              title="Delivered Orders"
              value={(s.totalOrders || 0).toLocaleString()}
              icon={ShoppingCart}
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
              sub={`vs previous ${days}d`}
            />
            <StatCard
              title="Pending Fulfillment"
              value={s.pendingOrders || 0}
              icon={Clock}
              gradient="bg-gradient-to-br from-amber-500 to-amber-600"
              sub="Awaiting shipment"
            />
            <StatCard
              title="Items Sold"
              value={(s.totalSales || 0).toLocaleString()}
              icon={Package}
              gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            />

            <StatCard
              title="Active Inventory"
              value={s.activeOffers || 0}
              icon={Store}
              gradient="bg-gradient-to-br from-violet-500 to-violet-600"
              sub="Currently public listed offers"
            />
            <StatCard
              title="Stock Alerts"
              value={s.outOfStock || 0}
              icon={AlertCircle}
              gradient={
                s.outOfStock > 0
                  ? "bg-gradient-to-br from-red-500 to-red-600"
                  : "bg-gradient-to-br from-slate-400 to-slate-500"
              }
              sub="Zero quantity offers"
            />
            <StatCard
              title="Store Rating"
              value={`${s.averageRating || "0.0"} / 5.0`}
              icon={Star}
              gradient="bg-gradient-to-br from-orange-400 to-amber-500"
            />
            <StatCard
              title="Status"
              value="Active"
              icon={Activity}
              gradient="bg-gradient-to-br from-teal-500 to-emerald-500"
              sub="Your store is visibly online"
            />
          </>
        )}
      </div>

      {/* ─── Charts Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard
          title="Sales Over Time"
          sub={`Revenue and Orders over the last ${days} days`}
          icon={TrendingUp}
          className="lg:col-span-2"
        >
          {loading ? (
            <Skeleton className="h-[300px]" />
          ) : salesData?.labels?.length > 0 ? (
            <div className="h-[300px]">
              <Line data={salesData} options={lineChartOptions("₹")} />
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Not enough data for the selected period
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Sales by Category"
          sub="Distribution of revenue"
          icon={Package}
        >
          {loading ? (
            <Skeleton className="h-[300px]" />
          ) : categoryData?.labels?.length > 0 ? (
            <div className="h-[300px]">
              <Doughnut data={categoryData} options={doughnutOptions} />
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No categories sold yet
            </div>
          )}
        </ChartCard>
      </div>

      {/* ─── Tables Row ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <SectionHeader icon={Star} title="Top Performing Products" />
            <Link
              to="/seller/products"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View All
            </Link>
          </div>
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Product</th>
                    <th className="px-6 py-3 font-semibold text-center">
                      Units Sold
                    </th>
                    <th className="px-6 py-3 font-semibold text-right">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topProducts.map((p, i) => (
                    <tr
                      key={i}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 w-4">
                          {i + 1}
                        </span>
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                            <Package size={16} className="text-gray-400" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900 line-clamp-1">
                          {p.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-gray-600">
                        {p.sold}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {formatCurrency(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 flex flex-col items-center justify-center text-gray-400 text-sm">
              <Star size={32} className="opacity-20 mb-2" />
              Not enough sales data to rank products.
            </div>
          )}
        </div>

        {/* Recent Orders to Fulfill */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <SectionHeader
              icon={Clock}
              title="Recent Orders"
              sub="New items needing fulfillment"
            />
            <Link
              to="/seller/orders"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Manage Orders
            </Link>
          </div>
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Order</th>
                    <th className="px-6 py-3 font-semibold">Item</th>
                    <th className="px-6 py-3 font-semibold text-center">Qty</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((o) => (
                    <tr
                      key={o.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {(o.Order?.orderId || o.id).substring(0, 8)}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800 line-clamp-1">
                          {o.Offer?.product?.name || "Product"}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          {formatCurrency(o.priceAtTimeOfPurchase)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-gray-600">
                        {o.quantity}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 flex flex-col items-center justify-center text-gray-400 text-sm">
              <ShoppingCart size={32} className="opacity-20 mb-2" />
              You have no recent orders.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
