import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getSellerOffers,
  deleteSellerOffer,
  updateSellerOffer,
  getSellerOrders,
  updateSellerOrderItemStatus,
  getSellerTransactions,
} from "../../api/seller";

export const fetchSellerOffers = createAsyncThunk(
  "seller/fetchOffers",
  async ({ page, search, status }, { rejectWithValue }) => {
    try {
      const data = await getSellerOffers({ page, limit: 10, search, status });
      return data; // { offers: [], totalPages }
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch offers");
    }
  },
);

export const toggleOfferStatusAction = createAsyncThunk(
  "seller/toggleOfferStatus",
  async ({ offerId, currentStatus }, { rejectWithValue }) => {
    const newStatus = currentStatus === "active" ? "draft" : "active";
    try {
      await updateSellerOffer(offerId, { status: newStatus });
      return { offerId, newStatus };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update status");
    }
  },
);

export const deleteOfferAction = createAsyncThunk(
  "seller/deleteOffer",
  async (offerId, { rejectWithValue }) => {
    try {
      await deleteSellerOffer(offerId);
      return offerId;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete offer");
    }
  },
);

export const fetchSellerOrders = createAsyncThunk(
  "seller/fetchOrders",
  async ({ page, search, status }, { rejectWithValue }) => {
    try {
      const data = await getSellerOrders({
        page,
        limit: 10,
        search,
        status,
      });
      return data; // { orders: [], totalPages }
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load orders");
    }
  },
);

export const updateOrderStatusAction = createAsyncThunk(
  "seller/updateOrderStatus",
  async ({ orderId, newStatus }, { rejectWithValue }) => {
    try {
      await updateSellerOrderItemStatus(orderId, newStatus);
      return { orderId, newStatus };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update status");
    }
  },
);

export const fetchSellerTransactions = createAsyncThunk(
  "seller/fetchTransactions",
  async ({ page, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const data = await getSellerTransactions({ page, limit });
      return data; // Expected { data: [...], totalPages: N } ... wait, api returns just the paginated object
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load transactions");
    }
  },
);

const initialState = {
  offers: [],
  orders: [],
  transactions: [],
  totalPages: 1,
  offersTotalPages: 1,
  ordersTotalPages: 1,
  transactionsTotalPages: 1,
  loading: false,
  error: null,
};

const sellerSlice = createSlice({
  name: "seller",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Offers
      .addCase(fetchSellerOffers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerOffers.fulfilled, (state, action) => {
        state.loading = false;
        state.offers = action.payload.offers || [];
        state.offersTotalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchSellerOffers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Toggle Status
      .addCase(toggleOfferStatusAction.fulfilled, (state, action) => {
        const { offerId, newStatus } = action.payload;
        const offer = state.offers.find((o) => o.id === offerId);
        if (offer) {
          offer.status = newStatus;
        }
      })
      // Delete Offer
      .addCase(deleteOfferAction.fulfilled, (state, action) => {
        state.offers = state.offers.filter((o) => o.id !== action.payload);
      })
      // Fetch Orders
      .addCase(fetchSellerOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders || [];
        state.ordersTotalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchSellerOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Order Status
      .addCase(updateOrderStatusAction.fulfilled, (state, action) => {
        const { orderId, newStatus } = action.payload;
        const order = state.orders.find((o) => o.id === orderId);
        if (order) {
          order.status = newStatus;
        }
      })
      // Fetch Transactions
      .addCase(fetchSellerTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.data || [];
        state.transactionsTotalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchSellerTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default sellerSlice.reducer;
