import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as cartApi from "../../api/cart";
import { toast } from "react-hot-toast";

// Thunks
// Assuming we pass user authentication state from component or access it via getState
export const syncGuestCart = createAsyncThunk(
  "cart/syncGuestCart",
  async (_, { rejectWithValue }) => {
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
      return true;
    } catch (e) {
      console.error("Error syncing guest cart:", e);
      return rejectWithValue(e.message);
    }
  },
);

export const fetchCartFromBackend = createAsyncThunk(
  "cart/fetchCartFromBackend",
  async (_, { rejectWithValue }) => {
    try {
      const data = await cartApi.getCart();
      const transformedCart = data.items.map((item) => ({
        id: item.details.product.id,
        offerId: item.offerId,
        name: item.details.product.name,
        slug: item.details.product.slug,
        price: item.details.activePrice || item.details.price,
        originalPrice: item.details.price,
        isDealActive: item.details.isDealActive,
        image: item.details.product.media?.[0]?.url || "",
        qty: item.quantity,
        stockQuantity: item.details.stockQuantity,
        condition: item.details.condition,
        sellerProfile: item.details.sellerProfile,
      }));
      return transformedCart;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch cart");
    }
  },
);

export const addToCartBackend = createAsyncThunk(
  "cart/addToCartBackend",
  async ({ product, qty = 1 }, { dispatch, rejectWithValue }) => {
    const offerId = product.offerId || product.id;
    try {
      await cartApi.addToCart(offerId, qty);
      await dispatch(fetchCartFromBackend());
      toast.success("Added to cart");
      return true;
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast.error("Failed to add to cart");
      return rejectWithValue(error.message);
    }
  },
);

export const removeFromCartBackend = createAsyncThunk(
  "cart/removeFromCartBackend",
  async (uniqueId, { dispatch, rejectWithValue }) => {
    try {
      await cartApi.removeFromCart(uniqueId);
      await dispatch(fetchCartFromBackend());
      toast.success("Removed from cart");
      return uniqueId;
    } catch (error) {
      console.error("Failed to remove from cart:", error);
      toast.error("Failed to remove from cart");
      return rejectWithValue(error.message);
    }
  },
);

export const updateQtyBackend = createAsyncThunk(
  "cart/updateQtyBackend",
  async ({ uniqueId, delta }, { getState, dispatch, rejectWithValue }) => {
    const { cart } = getState().cart;
    const item = cart.find((item) => (item.offerId || item.id) === uniqueId);
    if (!item) return rejectWithValue("Item not found");

    const newQty = item.qty + delta;
    if (newQty <= 0) {
      return dispatch(removeFromCartBackend(uniqueId));
    }

    try {
      await cartApi.updateCartItem(uniqueId, newQty);
      await dispatch(fetchCartFromBackend());
      return { uniqueId, newQty };
    } catch (error) {
      console.error("Failed to update quantity:", error);
      toast.error("Failed to update quantity");
      return rejectWithValue(error.message);
    }
  },
);

const getInitialGuestCart = () => {
  try {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const initialState = {
  cart: getInitialGuestCart(),
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Guest cart reducers
    addToCartGuest: (state, action) => {
      const product = action.payload;
      const uniqueId = product.offerId || product.id;
      const existing = state.cart.find(
        (item) => (item.offerId || item.id) === uniqueId,
      );

      if (existing) {
        existing.qty += 1;
      } else {
        state.cart.push({ ...product, qty: 1 });
      }
      localStorage.setItem("cart", JSON.stringify(state.cart));
      toast.success("Added to cart");
    },
    removeFromCartGuest: (state, action) => {
      const uniqueId = action.payload;
      state.cart = state.cart.filter(
        (item) => (item.offerId || item.id) !== uniqueId,
      );
      if (state.cart.length > 0) {
        localStorage.setItem("cart", JSON.stringify(state.cart));
      } else {
        localStorage.removeItem("cart");
      }
      toast.success("Removed from cart");
    },
    updateQtyGuest: (state, action) => {
      const { uniqueId, delta } = action.payload;
      state.cart = state.cart
        .map((item) => {
          if ((item.offerId || item.id) === uniqueId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : item;
          }
          return item;
        })
        .filter((item) => item.qty > 0);

      if (state.cart.length > 0) {
        localStorage.setItem("cart", JSON.stringify(state.cart));
      } else {
        localStorage.removeItem("cart");
      }
    },
    clearGuestCart: (state) => {
      state.cart = [];
      localStorage.removeItem("cart");
    },
    setCart: (state, action) => {
      state.cart = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCartFromBackend.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCartFromBackend.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
      })
      .addCase(fetchCartFromBackend.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add to Cart Backend
      .addCase(addToCartBackend.pending, (state) => {
        state.loading = true;
      })
      .addCase(addToCartBackend.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addToCartBackend.rejected, (state) => {
        state.loading = false;
      })
      // Remove from Cart Backend
      .addCase(removeFromCartBackend.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeFromCartBackend.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(removeFromCartBackend.rejected, (state) => {
        state.loading = false;
      })
      // Update Qty Backend
      .addCase(updateQtyBackend.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateQtyBackend.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateQtyBackend.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const {
  addToCartGuest,
  removeFromCartGuest,
  updateQtyGuest,
  clearGuestCart,
  setCart,
} = cartSlice.actions;

export default cartSlice.reducer;
