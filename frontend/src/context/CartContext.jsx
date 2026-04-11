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
} from "../store/cart/cartSlice";

export const useCart = () => {
  const dispatch = useDispatch();
  const { 
    cart, 
    loading, 
    subtotal: stateSubtotal, 
    taxAmount: stateTaxAmount, 
    totalAmount: stateTotalAmount, 
    discount: stateDiscount 
  } = useSelector((state) => state.cart);
  const { user } = useAuth();

  useEffect(() => {
    const initializeCart = async () => {
      if (user) {
        await dispatch(syncGuestCart());
        await dispatch(fetchCartFromBackend());
      }
    };

    const token = localStorage.getItem("token");
    if (user || token) {
      initializeCart();
    }
  }, [user, dispatch]);

  const addToCart = async (product, quantity = 1) => {
    if (user) {
      dispatch(addToCartBackend({ product, qty: quantity }));
    } else {
      dispatch(addToCartGuest({ product, qty: quantity }));
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

  const cartTotal = useMemo(() => {
    if (user) return stateTotalAmount;
    return cart.reduce((sum, item) => sum + (Number(item.price) || 0) * item.qty, 0);
  }, [cart, user, stateTotalAmount]);

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

  const cartDiscount = useMemo(() => {
    if (user) return stateDiscount;
    return cartMrpTotal - cartTotal;
  }, [cartMrpTotal, cartTotal, user, stateDiscount]);

  const taxAmount = useMemo(() => {
    if (user) return stateTaxAmount;
    return cartTotal * 0.18; // Default to 18% for guest
  }, [cartTotal, user, stateTaxAmount]);

  const subtotal = useMemo(() => {
    if (user) return stateSubtotal;
    return cartTotal - taxAmount;
  }, [cartTotal, taxAmount, user, stateSubtotal]);

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
    taxAmount,
    subtotal,
    loading,
    refreshCart,
  };
};
