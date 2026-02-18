import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";
import * as cartApi from "../api/cart";
import { toast } from "react-hot-toast";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("cart");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  // Fetch cart from backend when user logs in
  useEffect(() => {
    const initializeCart = async () => {
      if (user) {
        await syncGuestCart();
        await fetchCartFromBackend();
      } else {
        setCart([]);
      }
    };

    initializeCart();
  }, [user]);

  const syncGuestCart = async () => {
    try {
      const saved = localStorage.getItem("cart");
      if (saved) {
        const guestItems = JSON.parse(saved);
        for (const item of guestItems) {
          const offerId = item.offerId || item.id;
          const qty = item.qty || 1;
          if (offerId) {
            try {
              await cartApi.addToCart(offerId, qty);
            } catch (err) {
              console.error("Failed to sync guest item:", item, err);
            }
          }
        }
        localStorage.removeItem("cart");
      }
    } catch (e) {
      console.error("Error syncing guest cart:", e);
    }
  };

  // Save to localStorage for guest users only
  useEffect(() => {
    if (!user && cart.length > 0) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, user]);

  const fetchCartFromBackend = async () => {
    try {
      setLoading(true);
      const data = await cartApi.getCart();
      // Transform backend cart format to frontend format
      const transformedCart = data.items.map(item => ({
        id: item.details.product.id,
        offerId: item.offerId,
        name: item.details.product.name,
        slug: item.details.product.slug,
        price: item.details.price,
        image: item.details.product.media?.[0]?.url || "",
        qty: item.quantity,
        stockQuantity: item.details.stockQuantity,
        condition: item.details.condition,
        sellerProfile: item.details.sellerProfile,
      }));
      setCart(transformedCart);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product) => {
    const offerId = product.offerId || product.id;
    
    if (user) {
      // Logged-in user: sync with backend
      try {
        await cartApi.addToCart(offerId, 1);
        await fetchCartFromBackend();
        toast.success("Added to cart");
      } catch (error) {
        console.error("Failed to add to cart:", error);
        toast.error("Failed to add to cart");
      }
    } else {
      // Guest user: use localStorage
      setCart((prev) => {
        const uniqueId = product.offerId || product.id;
        const existing = prev.find((item) => (item.offerId || item.id) === uniqueId);
        
        if (existing) {
          return prev.map((item) =>
            (item.offerId || item.id) === uniqueId ? { ...item, qty: item.qty + 1 } : item,
          );
        }
        return [...prev, { ...product, qty: 1 }];
      });
      toast.success("Added to cart");
    }
  };

  const removeFromCart = async (uniqueId) => {
    if (user) {
      // Logged-in user: sync with backend
      try {
        await cartApi.removeFromCart(uniqueId);
        await fetchCartFromBackend();
        toast.success("Removed from cart");
      } catch (error) {
        console.error("Failed to remove from cart:", error);
        toast.error("Failed to remove from cart");
      }
    } else {
      // Guest user: use localStorage
      setCart((prev) => prev.filter((item) => (item.offerId || item.id) !== uniqueId));
      toast.success("Removed from cart");
    }
  };

  const updateQty = async (uniqueId, delta) => {
    if (user) {
      // Logged-in user: sync with backend
      const item = cart.find((item) => (item.offerId || item.id) === uniqueId);
      if (!item) return;
      
      const newQty = item.qty + delta;
      if (newQty <= 0) {
        await removeFromCart(uniqueId);
        return;
      }
      
      try {
        await cartApi.updateCartItem(uniqueId, newQty);
        await fetchCartFromBackend();
      } catch (error) {
        console.error("Failed to update quantity:", error);
        toast.error("Failed to update quantity");
      }
    } else {
      // Guest user: use localStorage
      setCart((prev) =>
        prev.map((item) => {
          if ((item.offerId || item.id) === uniqueId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : item;
          }
          return item;
        }).filter(item => item.qty > 0),
      );
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQty,
        cartTotal,
        cartCount,
        loading,
        refreshCart: user ? fetchCartFromBackend : () => {},
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
