import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { loadUser } from "./store/auth/authSlice";
import { fetchWishlist } from "./store/wishlist/wishlistSlice";
import {
  useSearchParams,
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import VerificationBanner from "./components/layout/VerificationBanner";
import { Toaster } from "react-hot-toast";

import Cart from "./pages/user/Cart";
import Home from "./pages/user/Home";
import Shop from "./pages/user/Shop";
import ProductDetail from "./pages/user/ProductDetail";
import Checkout from "./pages/user/Checkout";
import Payment from "./pages/user/Payment";
import OrderSuccess from "./pages/user/OrderSuccess";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import SellerRegister from "./pages/auth/SellerRegister";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import AccountLayout from "./pages/user/AccountLayout";
import Profile from "./pages/user/Profile";
import Settings from "./pages/user/Settings";
import Address from "./pages/user/Address";
import Orders from "./pages/user/Orders";
import OrderDetail from "./pages/user/OrderDetail";
import Wishlist from "./pages/user/Wishlist";
import Transactions from "./pages/user/Transactions";
import Notifications from "./pages/user/Notifications";
import MyReviews from "./pages/user/MyReviews";
import AffiliateDashboard from "./pages/user/AffiliateDashboard";
import { NotificationProvider } from "./context/NotificationContext";

import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminBrands from "./pages/admin/AdminBrands";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReviews from "./pages/admin/AdminReviews";
import SellerLayout from "./pages/seller/SellerLayout";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerProducts from "./pages/seller/SellerProducts";
import SellerOrders from "./pages/seller/SellerOrders";
import SellerPayments from "./pages/seller/SellerPayments";
import Offers from "./pages/seller/Offers";
import AddProduct from "./pages/seller/AddProduct";
import SellerReviews from "./pages/seller/SellerReviews";
import BrandStore from "./pages/user/BrandStore";

import About from "./pages/info/About";
import FAQ from "./pages/info/FAQ";
import Terms from "./pages/info/Terms";
import Privacy from "./pages/info/Privacy";
import Help from "./pages/info/Help";
import SellOnZapify from "./pages/info/SellOnZapify";
import Affiliate from "./pages/info/Affiliate";

const Placeholder = ({ title }) => (
  <div className="flex items-center justify-center min-h-[50vh] text-2xl font-bold text-gray-400">
    {title} - Coming Soon
  </div>
);

const SellerRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!user || (!user.roles?.includes("seller") && user.role !== "seller")) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!user || (!user.roles?.includes("admin") && user.role !== "admin")) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const ProtectedRoute = ({ children, redirectTo }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div>Loading...</div>;

  if (!user) {
    const from = redirectTo ? { pathname: redirectTo } : location;
    return <Navigate to="/login" state={{ from }} replace />;
  }

  return children;
};

const SocialLoginHandler = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const ticket = searchParams.get("ticket");
  const { loginWithTicket } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ticket) {
      loginWithTicket(ticket)
        .then(() => {
          setSearchParams({});
          navigate("/", { replace: true });
        })
        .catch((err) => {
          console.error("Social login failed:", err);
          navigate("/login", {
            replace: true,
            state: { message: "Social login failed. Please try again." },
          });
        });
    }
  }, [ticket, loginWithTicket, navigate, setSearchParams]);

  return null;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", color: "red" }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error.toString()}</pre>
          <pre>{this.state.error.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser()).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        dispatch(fetchWishlist());
      }
    });
  }, [dispatch]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("affiliateRef", ref);
      const url = new URL(window.location);
      url.searchParams.delete("ref");
      window.history.replaceState({}, "", url);
    }
  }, []);

  return (
    <ErrorBoundary>
      <Toaster position="top-right" />
      <Router>
        <NotificationProvider>
          <SocialLoginHandler />
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <VerificationBanner />

            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:slug" element={<ProductDetail />} />

                {/* Info Routes */}
                <Route path="/about" element={<About />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/help" element={<Help />} />
                <Route path="/sell" element={<SellOnZapify />} />
                <Route path="/affiliate" element={<Affiliate />} />

                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/store/:slug" element={<BrandStore />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/seller/register"
                  element={
                    <ProtectedRoute>
                      <SellerRegister />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/verify-email"
                  element={
                    <ProtectedRoute>
                      <VerifyEmail />
                    </ProtectedRoute>
                  }
                />

                {/* User Protected Routes */}
                <Route path="/cart" element={<Cart />} />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment"
                  element={
                    <ProtectedRoute>
                      <Payment />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/order-success/:orderId"
                  element={
                    <ProtectedRoute>
                      <OrderSuccess />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/account"
                  element={
                    <ProtectedRoute>
                      <AccountLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Profile />} />
                  <Route path="reviews" element={<MyReviews />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="orders/:orderId" element={<OrderDetail />} />
                  <Route path="addresses" element={<Address />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="wishlist" element={<Wishlist />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="notifications" element={<Notifications />} />
                </Route>

                <Route
                  path="/affiliate/dashboard"
                  element={
                    <ProtectedRoute>
                      <AffiliateDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Seller Routes */}
                <Route
                  path="/seller"
                  element={
                    <SellerRoute>
                      <SellerLayout />
                    </SellerRoute>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<SellerDashboard />} />
                  <Route path="products" element={<SellerProducts />} />
                  <Route path="products/add" element={<AddProduct />} />
                  <Route path="orders" element={<SellerOrders />} />
                  <Route path="offers" element={<Offers />} />
                  <Route path="payments" element={<SellerPayments />} />
                  <Route path="reviews" element={<SellerReviews />} />
                </Route>

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="brands" element={<AdminBrands />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="reviews" element={<AdminReviews />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <Footer />
          </div>
        </NotificationProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
