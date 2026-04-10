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
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Package,
  Users,
  Star,
  ShoppingBag,
  IndianRupee,
  TrendingUp,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Award,
  Clock,
  Store,
  Activity,
  Minus,
} from "lucide-react";
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
      {Math.abs(value)}%
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
const SectionHeader = ({ title, sub, icon: Icon }) => (
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
          yLabel === "₹"
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
        precision: 0,
        callback: (v) => {
          if (Math.floor(v) !== v) return "";
          return yLabel === "₹" ? `₹${(v / 1000).toFixed(0)}k` : v;
        },
      },
    },
  },
});

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: { boxWidth: 10, font: { size: 10 }, padding: 10 },
    },
  },
  cutout: "65%",
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [signupData, setSignupData] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      try {
        const [
          statsRes,
          salesRes,
          categoryRes,
          signupRes,
          orderRes,
          topProdRes,
          topSelRes,
          recentRes,
        ] = await Promise.all([
          api.get("/admin/stats"),
          api.get(`/admin/stats/sales-over-time?days=${days}`),
          api.get("/admin/stats/sales-by-category"),
          api.get(`/admin/stats/signup-analytics?days=${days}`),
          api.get(`/admin/stats/order-activity?days=${days}`),
          api.get("/admin/stats/top-products?limit=5"),
          api.get("/admin/stats/top-sellers?limit=5"),
          api.get("/admin/stats/recent-orders?limit=8"),
        ]);

        setStats(statsRes.data.stats);

        const rawSales = salesRes.data.salesData;
        setSalesData({
          ...rawSales,
          datasets: rawSales.datasets.map((ds) => ({
            ...ds,
            borderColor: "#6366f1",
            backgroundColor: "rgba(99,102,241,0.08)",
            borderWidth: 2,
            pointRadius: 3,
            fill: true,
            tension: 0.4,
          })),
        });

        const catRaw = categoryRes.data.categoryData;
        setCategoryData({
          ...catRaw,
          datasets: catRaw.datasets.map((ds) => ({
            ...ds,
            backgroundColor: [
              "#6366f1",
              "#ec4899",
              "#f59e0b",
              "#10b981",
              "#3b82f6",
              "#8b5cf6",
              "#f43f5e",
              "#14b8a6",
              "#f97316",
              "#a78bfa",
            ],
            borderWidth: 0,
          })),
        });

        const sigRaw = signupRes.data.signupData;
        setSignupData({
          ...sigRaw,
          datasets: sigRaw.datasets.map((ds, i) => ({
            ...ds,
            borderColor: i === 0 ? "#3b82f6" : "#f59e0b",
            backgroundColor:
              i === 0 ? "rgba(59,130,246,0.08)" : "rgba(245,158,11,0.08)",
            borderWidth: 2,
            pointRadius: 3,
            fill: true,
            tension: 0.4,
          })),
        });

        const ordRaw = orderRes.data.orderData;
        setOrderData({
          ...ordRaw,
          datasets: ordRaw.datasets.map((ds, i) => ({
            ...ds,
            backgroundColor:
              i === 0 ? "#10b981" : i === 1 ? "#6366f1" : "#ef4444",
            borderRadius: 4,
            borderSkipped: false,
          })),
        });

        setTopProducts(topProdRes.data.data || []);
        setTopSellers(topSelRes.data.data || []);
        setRecentOrders(recentRes.data.data || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [days],
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const s = stats || {};

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Platform Overview</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Live stats & analytics across Zapify
          </p>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <PeriodSelector
            value={days}
            onChange={setDays}
            className="cursor-pointer"
          />
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Stat Cards (8 cards, 2 rows of 4) ──────────────────────── */}
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
              sub={`${formatCurrency(s.todayRevenue || 0)} today`}
            />
            <StatCard
              title="Total Orders"
              value={(s.totalOrders || 0).toLocaleString()}
              icon={ShoppingCart}
              gradient="bg-gradient-to-br from-violet-500 to-violet-600"
              trend={s.ordersGrowth}
              sub="All time"
            />
            <StatCard
              title="Total Sellers"
              value={(s.totalSellers || 0).toLocaleString()}
              icon={Store}
              gradient="bg-gradient-to-br from-sky-500 to-sky-600"
            />
            <StatCard
              title="Total Customers"
              value={(s.totalUsers || 0).toLocaleString()}
              icon={Users}
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
            />
            <StatCard
              title="Pending Products"
              value={s.pendingProducts || 0}
              icon={Package}
              gradient="bg-gradient-to-br from-orange-400 to-orange-500"
              sub="Awaiting review"
            />
            <StatCard
              title="Pending Reviews"
              value={s.pendingReviews || 0}
              icon={Star}
              gradient="bg-gradient-to-br from-pink-500 to-pink-600"
              sub="Awaiting moderation"
            />
            <StatCard
              title="GMV (30d)"
              value={formatCurrency(
                s.revenueGrowth !== undefined && s.totalRevenue
                  ? s.totalRevenue * (1 / (1 + (s.revenueGrowth || 0) / 100))
                  : 0,
              )}
              icon={TrendingUp}
              gradient="bg-gradient-to-br from-teal-500 to-teal-600"
              sub="Previous 30 days"
            />
            <StatCard
              title="Activity"
              value="Live"
              icon={Activity}
              gradient="bg-gradient-to-br from-rose-500 to-rose-600"
              sub="All workers running"
            />
          </>
        )}
      </div>

      {/* ── Charts Row 1: Sales Over Time + Category Doughnut ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard
          title="Revenue Over Time"
          sub={`Last ${days} days · delivered orders only`}
          icon={TrendingUp}
          className="lg:col-span-2"
        >
          {loading ? (
            <Skeleton className="h-64" />
          ) : salesData ? (
            <Line
              data={salesData}
              options={lineChartOptions("₹")}
              height={280}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No sales data yet
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Sales by Category"
          sub="All-time, delivered"
          icon={ShoppingBag}
        >
          {loading ? (
            <Skeleton className="h-64" />
          ) : categoryData && categoryData.labels.length > 0 ? (
            <Doughnut
              data={categoryData}
              options={doughnutOptions}
              height={280}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-sm text-gray-400">
              No category data yet
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Charts Row 2: Signup + Order Activity ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="User & Seller Signups"
          sub={`New registrations · last ${days} days`}
          icon={Users}
        >
          {signupData ? (
            <Line
              data={signupData}
              options={lineChartOptions("count")}
              height={240}
            />
          ) : (
            <Skeleton className="h-56" />
          )}
        </ChartCard>

        <ChartCard
          title="Order Activity"
          sub={`Delivered / Processing / Cancelled · last ${days} days`}
          icon={ShoppingCart}
        >
          {orderData ? (
            <Bar
              data={orderData}
              options={{
                ...lineChartOptions("count"),
                plugins: {
                  ...lineChartOptions("count").plugins,
                  legend: {
                    display: true,
                    position: "top",
                    labels: { boxWidth: 10, font: { size: 11 } },
                  },
                },
              }}
              height={240}
            />
          ) : (
            <Skeleton className="h-56" />
          )}
        </ChartCard>
      </div>

      {/* ── Tables Row: Top Products + Top Sellers ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionHeader
            icon={Award}
            title="Top Products"
            sub="By revenue · delivered only"
          />
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              No sales data yet
            </p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl hover:bg-gray-50 transition-colors px-2 py-1.5"
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {i + 1}
                  </span>
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-9 h-9 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <Package size={16} className="text-indigo-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {p.unitsSold} units sold
                    </p>
                  </div>
                  <span className="text-sm font-bold text-indigo-600 flex-shrink-0">
                    {formatCurrency(p.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Sellers */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionHeader
            icon={Store}
            title="Top Sellers"
            sub="By revenue · delivered only"
          />
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : topSellers.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              No sales data yet
            </p>
          ) : (
            <div className="space-y-3">
              {topSellers.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl hover:bg-gray-50 transition-colors px-2 py-1.5"
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {i + 1}
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <Store size={16} className="text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {s.storeName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-amber-500">★</span>
                      <p className="text-xs text-gray-400">
                        {Number(s.averageRating).toFixed(1)} · {s.unitsSold}{" "}
                        units
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-violet-600 flex-shrink-0">
                    {formatCurrency(s.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Orders Feed ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <SectionHeader
          icon={Clock}
          title="Recent Orders"
          sub="Latest 8 orders across the platform"
        />
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            No orders placed yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2 font-semibold">Order ID</th>
                  <th className="text-left pb-2 font-semibold">Customer</th>
                  <th className="text-left pb-2 font-semibold hidden md:table-cell">
                    Item
                  </th>
                  <th className="text-left pb-2 font-semibold">Amount</th>
                  <th className="text-left pb-2 font-semibold">Status</th>
                  <th className="text-left pb-2 font-semibold hidden lg:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order) => {
                  const firstItem = order.orderItems?.[0];
                  const productName = firstItem?.Offer?.product?.name || "—";
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 pr-3 font-mono text-xs font-semibold text-indigo-600">
                        #{order.uniqueOrderId}
                      </td>
                      <td className="py-3 pr-3">
                        <div>
                          <p className="font-medium text-gray-800 truncate max-w-[120px]">
                            {order.user?.fullname || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-400 truncate max-w-[120px]">
                            {order.user?.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 pr-3 hidden md:table-cell text-gray-600 truncate max-w-[160px]">
                        {productName}
                      </td>
                      <td className="py-3 pr-3 font-semibold text-gray-800">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-3 pr-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3 text-gray-400 text-xs hidden lg:table-cell">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
