import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAllProducts,
  getPendingProducts,
  toggleProductStatus,
  deleteProduct,
} from "../../api/products";
import { getAllCategories, toggleCategoryStatus } from "../../api/categories";
import { getAllBrands, toggleBrandStatus } from "../../api/brands";
import api from "../../api/axios";

export const fetchAdminProducts = createAsyncThunk(
  "admin/fetchProducts",
  async (tab, { rejectWithValue }) => {
    try {
      let data;
      if (tab === "pending") {
        data = await getPendingProducts();
      } else {
        data = await getAllProducts();
      }
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch products");
    }
  },
);

export const approveProductAction = createAsyncThunk(
  "admin/approveProduct",
  async (productId, { rejectWithValue }) => {
    try {
      await api.patch(`/product/review/${productId}`, {
        status: "active",
        adminComment: "Approved by admin",
      });
      return productId;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to approve product");
    }
  },
);

export const rejectProductAction = createAsyncThunk(
  "admin/rejectProduct",
  async (productId, { rejectWithValue }) => {
    try {
      await api.patch(`/product/review/${productId}`, {
        status: "rejected",
        adminComment: "Rejected by admin",
      });
      return productId;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to reject product");
    }
  },
);

export const toggleProductStatusAction = createAsyncThunk(
  "admin/toggleProductStatus",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await toggleProductStatus(productId);
      return { productId, isActive: response.product.isActive };
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to toggle product status",
      );
    }
  },
);

export const deleteProductAction = createAsyncThunk(
  "admin/deleteProduct",
  async (productId, { rejectWithValue }) => {
    try {
      await deleteProduct(productId);
      return productId;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete product");
    }
  },
);

export const fetchAdminCategories = createAsyncThunk(
  "admin/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getAllCategories();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch categories");
    }
  },
);

export const toggleCategoryStatusAction = createAsyncThunk(
  "admin/toggleCategoryStatus",
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await toggleCategoryStatus(categoryId);
      return { categoryId, isActive: response.category.isActive };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to toggle status");
    }
  },
);

export const deleteCategoryAction = createAsyncThunk(
  "admin/deleteCategory",
  async (categoryId, { rejectWithValue }) => {
    try {
      await api.delete(`/category/${categoryId}`);
      return categoryId;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete category");
    }
  },
);

export const fetchAdminBrands = createAsyncThunk(
  "admin/fetchBrands",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getAllBrands();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch brands");
    }
  },
);

export const toggleBrandStatusAction = createAsyncThunk(
  "admin/toggleBrandStatus",
  async (brandId, { rejectWithValue }) => {
    try {
      const response = await toggleBrandStatus(brandId);
      return { brandId, isActive: response.brand.isActive };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to toggle status");
    }
  },
);

export const deleteBrandAction = createAsyncThunk(
  "admin/deleteBrand",
  async (brandId, { rejectWithValue }) => {
    try {
      await api.delete(`/brand/${brandId}`);
      return brandId;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete brand");
    }
  },
);

export const fetchAdminOrders = createAsyncThunk(
  "admin/fetchOrders",
  async ({ page, limit }, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `/admin/orders?page=${page}&limit=${limit || 10}`,
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch orders");
    }
  },
);

export const fetchOrderDetails = createAsyncThunk(
  "admin/fetchOrderDetails",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/admin/orders/${orderId}`);
      return res.data.order;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch order details");
    }
  },
);

export const updateOrderStatusAction = createAsyncThunk(
  "admin/updateOrderStatus",
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/admin/orders/${orderId}/status`, {
        status,
      });
      return res.data.order;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update order status");
    }
  },
);

export const refundOrderAction = createAsyncThunk(
  "admin/refundOrder",
  async (
    { orderId, amount = null, reason = "requested_by_customer" },
    { rejectWithValue },
  ) => {
    try {
      const res = await api.post(`/payment/${orderId}/refund`, {
        amount,
        reason,
      });
      return res.data.data.payment;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error.message ||
          "Failed to initiate refund",
      );
    }
  },
);

export const fetchAdminUsers = createAsyncThunk(
  "admin/fetchUsers",
  async ({ roleFilter, page, limit }, { rejectWithValue }) => {
    try {
      const effectiveRole = roleFilter || "user";
      const res = await api.get(
        `/admin/list/${effectiveRole}?page=${page}&limit=${limit || 10}`,
      );
      return res.data; // { result: [], totalPages }
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch users");
    }
  },
);

export const toggleUserBlockStatusAction = createAsyncThunk(
  "admin/toggleUserBlockStatus",
  async ({ userId, newStatus }, { rejectWithValue }) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      return { userId, isBlocked: newStatus === "blocked" };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to toggle user status");
    }
  },
);

export const deleteUserAction = createAsyncThunk(
  "admin/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      return userId;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete user");
    }
  },
);

export const requestUserEditOtpAction = createAsyncThunk(
  "admin/requestUserEditOtp",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.post(`/admin/users/${userId}/request-edit-otp`);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to request OTP");
    }
  },
);

export const updateUserWithOtpAction = createAsyncThunk(
  "admin/updateUserWithOtp",
  async ({ userId, otp, updateData }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/admin/users/${userId}/edit-with-otp`, {
        otp,
        updateData,
      });
      return res.data.user;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update user profile");
    }
  },
);

export const fetchPendingReviews = createAsyncThunk(
  "admin/fetchPendingReviews",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/review/admin/queue?status=pending&limit=100");
      return Array.isArray(res.data.data) ? res.data.data : [];
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch reviews");
    }
  },
);

export const moderateReviewAction = createAsyncThunk(
  "admin/moderateReview",
  async ({ reviewId, decision, reason, note }, { rejectWithValue }) => {
    try {
      await api.post(`/review/admin/review/${reviewId}/moderate`, {
        decision,
        reason,
        note,
      });
      return { reviewId, decision };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to moderate review");
    }
  },
);

const initialState = {
  products: [],
  categories: [],
  brands: [],
  orders: [],
  selectedOrder: null,
  ordersTotalPages: 1,
  users: [],
  usersTotalPages: 1,
  pendingReviews: [],
  productsLoading: false,
  ordersLoading: false,
  usersLoading: false,
  reviewsLoading: false,
  loading: false, // kept for shared use (order details, etc.)
  error: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminProducts.pending, (state) => {
        state.productsLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.productsLoading = false;
        state.products = action.payload;
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.productsLoading = false;
        if (
          action.payload === "Request aborted" ||
          action.payload === "canceled" ||
          action.error?.name === "AbortError"
        )
          return;
        state.error = action.payload;
      })
      .addCase(toggleProductStatusAction.fulfilled, (state, action) => {
        const { productId, isActive } = action.payload;
        const product = state.products.find((p) => p.id === productId);
        if (product) {
          product.isActive = isActive;
        }
      })
      .addCase(approveProductAction.fulfilled, () => {}) // Refetch is handled by UI Component
      .addCase(rejectProductAction.fulfilled, () => {}) // Refetch is handled by UI Component
      .addCase(deleteProductAction.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => p.id !== action.payload);
      })
      .addCase(fetchAdminCategories.pending, (state) => {
        state.productsLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminCategories.fulfilled, (state, action) => {
        state.productsLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchAdminCategories.rejected, (state, action) => {
        state.productsLoading = false;
        if (
          action.payload === "Request aborted" ||
          action.payload === "canceled" ||
          action.error?.name === "AbortError"
        )
          return;
        state.error = action.payload;
      })
      .addCase(toggleCategoryStatusAction.fulfilled, (state, action) => {
        const { categoryId, isActive } = action.payload;
        const category = state.categories.find((c) => c.id === categoryId);
        if (category) {
          category.isActive = isActive;
        }
      })
      .addCase(deleteCategoryAction.fulfilled, (state, action) => {
        state.categories = state.categories.filter(
          (c) => c.id !== action.payload,
        );
      })
      .addCase(fetchAdminBrands.pending, (state) => {
        state.productsLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminBrands.fulfilled, (state, action) => {
        state.productsLoading = false;
        state.brands = action.payload;
      })
      .addCase(fetchAdminBrands.rejected, (state, action) => {
        state.productsLoading = false;
        if (
          action.payload === "Request aborted" ||
          action.payload === "canceled" ||
          action.error?.name === "AbortError"
        )
          return;
        state.error = action.payload;
      })
      .addCase(toggleBrandStatusAction.fulfilled, (state, action) => {
        const { brandId, isActive } = action.payload;
        const brand = state.brands.find((b) => b.id === brandId);
        if (brand) {
          brand.isActive = isActive;
        }
      })
      .addCase(deleteBrandAction.fulfilled, (state, action) => {
        state.brands = state.brands.filter((b) => b.id !== action.payload);
      })
      .addCase(fetchAdminOrders.pending, (state) => {
        state.ordersLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.ordersLoading = false;
        state.orders = action.payload.data || [];
        state.ordersTotalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.ordersLoading = false;
        if (
          action.payload === "Request aborted" ||
          action.payload === "canceled" ||
          action.error?.name === "AbortError"
        )
          return;
        state.error = action.payload;
      })
      .addCase(fetchOrderDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateOrderStatusAction.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.orders.findIndex((o) => o.id === updated.id);
        if (idx !== -1) state.orders[idx].status = updated.status;
        if (state.selectedOrder?.id === updated.id) {
          state.selectedOrder = updated;
        }
      })
      .addCase(fetchAdminUsers.pending, (state) => {
        state.usersLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload.data || [];
        state.usersTotalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.usersLoading = false;
        if (
          action.payload === "Request aborted" ||
          action.payload === "canceled" ||
          action.error?.name === "AbortError"
        )
          return;
        state.error = action.payload;
      })
      .addCase(toggleUserBlockStatusAction.fulfilled, (state, action) => {
        const { userId, isBlocked } = action.payload;
        const user = state.users.find((u) => u.id === userId);
        if (user) {
          user.isBlocked = isBlocked;
        }
      })
      .addCase(deleteUserAction.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
      })
      .addCase(updateUserWithOtpAction.fulfilled, (state, action) => {
        const updatedUser = action.payload;
        const index = state.users.findIndex((u) => u.id === updatedUser.id);
        if (index !== -1) {
          state.users[index] = updatedUser;
        }
      })
      .addCase(fetchPendingReviews.pending, (state) => {
        state.reviewsLoading = true;
        state.error = null;
      })
      .addCase(fetchPendingReviews.fulfilled, (state, action) => {
        state.reviewsLoading = false;
        state.pendingReviews = Array.isArray(action.payload)
          ? action.payload
          : [];
      })
      .addCase(fetchPendingReviews.rejected, (state, action) => {
        state.reviewsLoading = false;
        if (
          action.payload === "Request aborted" ||
          action.payload === "canceled" ||
          action.error?.name === "AbortError"
        )
          return;
        state.error = action.payload;
      })
      .addCase(moderateReviewAction.fulfilled, (state, action) => {
        const { reviewId } = action.payload;
        state.pendingReviews = state.pendingReviews.filter(
          (r) => r.id !== reviewId,
        );
      });
  },
});

export default adminSlice.reducer;
