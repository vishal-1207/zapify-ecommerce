import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

// Pages
import Home from "./pages/user/Home";

// Placeholder for pages we haven't built yet
const Placeholder = ({ title }) => (
  <div className="flex items-center justify-center min-h-[50vh] text-2xl font-bold text-gray-400">
    {title} - Coming Soon
  </div>
);

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Navbar />

            <main className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route
                  path="/shop"
                  element={<Placeholder title="Shop Page" />}
                />
                <Route
                  path="/product/:id"
                  element={<Placeholder title="Product Details" />}
                />
                <Route path="/login" element={<Placeholder title="Login" />} />

                {/* User Protected Routes */}
                <Route path="/cart" element={<Placeholder title="Cart" />} />
                <Route
                  path="/checkout"
                  element={<Placeholder title="Checkout" />}
                />
                <Route
                  path="/orders"
                  element={<Placeholder title="My Orders" />}
                />
                <Route
                  path="/account"
                  element={<Placeholder title="Account Settings" />}
                />

                {/* Seller Routes */}
                <Route
                  path="/seller/dashboard"
                  element={<Placeholder title="Seller Dashboard" />}
                />
                <Route
                  path="/seller/offers"
                  element={<Placeholder title="Seller Offers" />}
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/dashboard"
                  element={<Placeholder title="Admin Dashboard" />}
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
