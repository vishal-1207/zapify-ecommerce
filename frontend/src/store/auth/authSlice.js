import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  loginUser,
  getUserProfile,
  exchangeTicket,
  resendEmailVerification,
} from "../../api/auth";

// Thunks
export const loadUser = createAsyncThunk(
  "auth/loadUser",
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem("token");
    if (!token) {
      return rejectWithValue("No token");
    }
    try {
      const user = await getUserProfile();
      if (user && (user.id || user._id)) {
        const userRoles = user.roles || ["user"];
        const initialRole = userRoles.includes("admin") ? "admin" : "user";
        return { user: user, role: initialRole };
      }
      return rejectWithValue("Invalid user response");
    } catch (error) {
      localStorage.removeItem("token");
      return rejectWithValue(
        error.response?.data?.message || "Failed to load user profile",
      );
    }
  },
);

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await loginUser(email, password);
      if (res.success || res.accessToken) {
        localStorage.setItem("token", res.accessToken);

        let loggedInUser = null;
        let loggedInRole = "user";

        if (res.user) {
          loggedInUser = res.user;
          const userRoles = res.user.roles || ["user"];
          loggedInRole = userRoles.includes("admin") ? "admin" : "user";
        } else {
          const profileUser = await getUserProfile();
          loggedInUser = profileUser;
          const userRoles = profileUser.roles || ["user"];
          loggedInRole = userRoles.includes("admin") ? "admin" : "user";
        }
        return { success: true, user: loggedInUser, role: loggedInRole };
      }
      return rejectWithValue(res.message || "Login failed");
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Invalid email or password",
      );
    }
  },
);

export const loginWithTicket = createAsyncThunk(
  "auth/loginWithTicket",
  async (ticket, { rejectWithValue }) => {
    try {
      const res = await exchangeTicket(ticket);
      if (res.accessToken) {
        localStorage.setItem("token", res.accessToken);
        let loggedInUser = null;
        let loggedInRole = "user";

        if (res.user) {
          loggedInUser = res.user;
          const userRoles = res.user.roles || ["user"];
          loggedInRole = userRoles.includes("admin") ? "admin" : "user";
        } else {
          const profileUser = await getUserProfile();
          loggedInUser = profileUser;
          const userRoles = profileUser.roles || ["user"];
          loggedInRole = userRoles.includes("admin") ? "admin" : "user";
        }
        return { success: true, user: loggedInUser, role: loggedInRole };
      }
      return rejectWithValue("Token exchange failed");
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Social login failed",
      );
    }
  },
);

export const resendVerification = createAsyncThunk(
  "auth/resendVerification",
  async (_, { getState, rejectWithValue }) => {
    const { user } = getState().auth;
    if (!user?.email) return rejectWithValue("No email found");
    try {
      await resendEmailVerification(user.email);
      return { success: true, message: "Verification email sent!" };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send email",
      );
    }
  },
);

const initialState = {
  user: null,
  role: "guest",
  isLoading: true,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem("token");
      state.user = null;
      state.role = "guest";
      state.error = null;
      window.location.href = "/login";
    },
    switchRole: (state, action) => {
      state.role = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load User
      .addCase(loadUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.role = action.payload.role;
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.role = "guest";
        state.error = action.payload;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.role = action.payload.role;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Login With Ticket
      .addCase(loginWithTicket.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithTicket.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.role = action.payload.role;
      })
      .addCase(loginWithTicket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, switchRole } = authSlice.actions;

export default authSlice.reducer;
