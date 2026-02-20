import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAllProducts,
  getPendingProducts,
  toggleProductStatus,
  deleteProduct,
} from "../../api/products";
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
  async (productId, { dispatch, rejectWithValue }) => {
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
  async (productId, { dispatch, rejectWithValue }) => {
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

// --- Categories ---
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
      await delCat(categoryId);
      return categoryId;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete category");
    }
  },
);

// --- Brands ---
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
      await delBrand(brandId);
      return brandId;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete brand");
    }
  },
);

// --- Orders ---
export const fetchAdminOrders = createAsyncThunk(
  "admin/fetchOrders",
  async ({ page, limit }, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `/admin/orders?page=${page}&limit=${limit || 10}`,
      );
      return res.data; // { result: [], totalPages }
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch orders");
    }
  },
);

// --- Users ---
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

// --- Reviews ---
export const fetchPendingReviews = createAsyncThunk(
  "admin/fetchPendingReviews",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/reviews/admin/pending-reviews");
      // res.data.reviews could be directly the array since reviews is often the top-level property
      return res.data.reviews || res.data || [];
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch reviews");
    }
  },
);

export const moderateReviewAction = createAsyncThunk(
  "admin/moderateReview",
  async ({ reviewId, status }, { rejectWithValue }) => {
    try {
      await api.post(`/reviews/admin/review/${reviewId}/moderate`, { status });
      return { reviewId, status };
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
  ordersTotalPages: 1,
  users: [],
  usersTotalPages: 1,
  pendingReviews: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchAdminProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Toggle Product Status
      .addCase(toggleProductStatusAction.fulfilled, (state, action) => {
        const { productId, isActive } = action.payload;
        const product = state.products.find((p) => p.id === productId);
        if (product) {
          product.isActive = isActive;
        }
      })
      // Approve Product
      .addCase(approveProductAction.fulfilled, (state, action) => {}) // Refetch is handled by UI Component
      // Reject Product
      .addCase(rejectProductAction.fulfilled, (state, action) => {}) // Refetch is handled by UI Component
      // Delete Product
      .addCase(deleteProductAction.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => p.id !== action.payload);
      })
      // Fetch Categories
      .addCase(fetchAdminCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchAdminCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Toggle Category Status
      .addCase(toggleCategoryStatusAction.fulfilled, (state, action) => {
        const { categoryId, isActive } = action.payload;
        const category = state.categories.find((c) => c.id === categoryId);
        if (category) {
          category.isActive = isActive;
        }
      })
      // Delete Category
      .addCase(deleteCategoryAction.fulfilled, (state, action) => {
        state.categories = state.categories.filter(
          (c) => c.id !== action.payload,
        );
      })
      // Fetch Brands
      .addCase(fetchAdminBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminBrands.fulfilled, (state, action) => {
        state.loading = false;
        state.brands = action.payload;
      })
      .addCase(fetchAdminBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Toggle Brand Status
      .addCase(toggleBrandStatusAction.fulfilled, (state, action) => {
        const { brandId, isActive } = action.payload;
        const brand = state.brands.find((b) => b.id === brandId);
        if (brand) {
          brand.isActive = isActive;
        }
      })
      // Delete Brand
      .addCase(deleteBrandAction.fulfilled, (state, action) => {
        state.brands = state.brands.filter((b) => b.id !== action.payload);
      })
      // Fetch Orders
      .addCase(fetchAdminOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.result || [];
        state.ordersTotalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Users
      .addCase(fetchAdminUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.result || [];
        state.usersTotalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Toggle User Block Status
      .addCase(toggleUserBlockStatusAction.fulfilled, (state, action) => {
        const { userId, isBlocked } = action.payload;
        const user = state.users.find((u) => u.id === userId);
        if (user) {
          user.isBlocked = isBlocked;
        }
      })
      // Delete User
      .addCase(deleteUserAction.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
      })
      // Fetch Pending Reviews
      .addCase(fetchPendingReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingReviews = action.payload;
      })
      .addCase(fetchPendingReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Moderate Review
      .addCase(moderateReviewAction.fulfilled, (state, action) => {
        const { reviewId, status } = action.payload;
        state.pendingReviews = state.pendingReviews.filter(
          (r) => r.id !== reviewId,
        );
      });
  },
});

export default adminSlice.reducer;
