import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../../api/wishlist";

export const fetchWishlist = createAsyncThunk(
  "wishlist/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const items = await getWishlist();
      return items;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch wishlist",
      );
    }
  },
);

export const toggleWishlist = createAsyncThunk(
  "wishlist/toggle",
  async (productId, { getState, rejectWithValue }) => {
    const { ids } = getState().wishlist;
    const isWishlisted = ids.includes(productId);
    try {
      if (isWishlisted) {
        await removeFromWishlist(productId);
        return { productId, action: "removed" };
      } else {
        const item = await addToWishlist(productId);
        return { productId, action: "added", item };
      }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update wishlist",
      );
    }
  },
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    items: [], // full item objects from server (for the Wishlist page)
    ids: [], // array of productIds for quick O(1) lookup
    loading: false,
    error: null,
  },
  reducers: {
    clearWishlist: (state) => {
      state.items = [];
      state.ids = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.ids = action.payload.map((item) => item.productId);
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Toggle
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        const { productId, action: act, item } = action.payload;
        if (act === "removed") {
          state.items = state.items.filter((i) => i.productId !== productId);
          state.ids = state.ids.filter((id) => id !== productId);
        } else {
          if (item) state.items.push(item);
          state.ids.push(productId);
        }
      })
      .addCase(toggleWishlist.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearWishlist } = wishlistSlice.actions;

// Selectors
export const selectWishlistIds = (state) => state.wishlist.ids;
export const selectWishlistItems = (state) => state.wishlist.items;
export const selectWishlistLoading = (state) => state.wishlist.loading;

export default wishlistSlice.reducer;
