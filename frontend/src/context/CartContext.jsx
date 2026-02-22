import { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "./AuthContext";
import {
  syncGuestCart,
  fetchCartFromBackend,
  addToCartBackend,
  removeFromCartBackend,
  updateQtyBackend,
  addToCartGuest,
  removeFromCartGuest,
  updateQtyGuest,
  clearGuestCart,
} from "../store/cart/cartSlice";

export const useCart = () => {
  const dispatch = useDispatch();
  const { cart, loading } = useSelector((state) => state.cart);
  const { user } = useAuth();

  // Fetch cart from backend when user logs in
  useEffect(() => {
    const initializeCart = async () => {
      if (user) {
        await dispatch(syncGuestCart());
        await dispatch(fetchCartFromBackend());
      } else {
        dispatch(clearGuestCart());
      }
    };

    // Added check for token directly incase useAuth takes time to update state
    const token = localStorage.getItem("token");
    if (user || token) {
      initializeCart();
    }
  }, [user, dispatch]);

  const addToCart = async (product) => {
    if (user) {
      dispatch(addToCartBackend({ product, qty: 1 }));
    } else {
      dispatch(addToCartGuest(product));
    }
  };

  const removeFromCart = async (uniqueId) => {
    if (user) {
      dispatch(removeFromCartBackend(uniqueId));
    } else {
      dispatch(removeFromCartGuest(uniqueId));
    }
  };

  const updateQty = async (uniqueId, delta) => {
    if (user) {
      dispatch(updateQtyBackend({ uniqueId, delta }));
    } else {
      dispatch(updateQtyGuest({ uniqueId, delta }));
    }
  };

  const cartTotal = useMemo(
    () =>
      cart.reduce((sum, item) => sum + (Number(item.price) || 0) * item.qty, 0),
    [cart],
  );

  const cartMrpTotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          Math.max(
            Number(item.mrp) || 0,
            Number(item.originalPrice) || 0,
            Number(item.price) || 0,
          ) *
            item.qty,
        0,
      ),
    [cart],
  );

  const cartSellerPriceTotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          (Number(item.originalPrice) || Number(item.price) || 0) * item.qty,
        0,
      ),
    [cart],
  );

  const cartDiscount = useMemo(
    () => cartMrpTotal - cartTotal,
    [cartMrpTotal, cartTotal],
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart],
  );

  const refreshCart = () => {
    if (user) {
      dispatch(fetchCartFromBackend());
    }
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQty,
    cartTotal,
    cartMrpTotal,
    cartSellerPriceTotal,
    cartDiscount,
    cartCount,
    loading,
    refreshCart,
  };
};
