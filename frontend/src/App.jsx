import React, { useEffect } from "react";
import {
  useSearchParams,
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import VerificationBanner from "./components/layout/VerificationBanner";
import { Toaster } from "react-hot-toast";

// Pages
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

// Admin Pages
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminBrands from "./pages/admin/AdminBrands";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminReviews from "./pages/admin/AdminReviews";
// Seller Pages
import SellerLayout from "./pages/seller/SellerLayout";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerProducts from "./pages/seller/SellerProducts";
import SellerOrders from "./pages/seller/SellerOrders";
import Offers from "./pages/seller/Offers";
import AddProduct from "./pages/seller/AddProduct";
import BrandStore from "./pages/user/BrandStore";

const Placeholder = ({ title }) => (
  <div className="flex items-center justify-center min-h-[50vh] text-2xl font-bold text-gray-400">
    {title} - Coming Soon
  </div>
);

const SellerRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  // Reverted to allow access if user has seller role, regardless of current active role
  // This fixes the issue where refreshing or direct access would block the user
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

// Social Login Handler Component
const ProtectedRoute = ({ children, redirectTo }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div>Loading...</div>;

  if (!user) {
    // If redirectTo is provided (e.g. "/cart"), send them there after login.
    // Otherwise, send them back to where they were trying to go.
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
          // Clear query params
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
  return (
    <ErrorBoundary>
      <Toaster position="top-right" />
      <AuthProvider>
        <CartProvider>
          <Router>
            <SocialLoginHandler />
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <VerificationBanner />

              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:slug" element={<ProductDetail />} />

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

                  {/* Account Routes */}
                  <Route
                    path="/account"
                    element={
                      <ProtectedRoute>
                        <AccountLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Profile />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="orders/:orderId" element={<OrderDetail />} />
                    <Route path="addresses" element={<Address />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>

                  {/* Seller Routes */}
                  <Route
                    path="/seller"
                    element={
                      <SellerRoute>
                        <SellerLayout />
                      </SellerRoute>
                    }
                  >
                    <Route
                      index
                      element={<Navigate to="dashboard" replace />}
                    />
                    <Route path="dashboard" element={<SellerDashboard />} />
                    <Route path="products" element={<SellerProducts />} />
                    <Route path="products/add" element={<AddProduct />} />
                    <Route path="orders" element={<SellerOrders />} />
                    <Route path="offers" element={<Offers />} />
                    <Route
                      path="payments"
                      element={<Placeholder title="Seller Payments" />}
                    />
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
                    <Route
                      index
                      element={<Navigate to="dashboard" replace />}
                    />
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
          </Router>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
