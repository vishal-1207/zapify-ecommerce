import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice";
import cartReducer from "./cart/cartSlice";

import adminReducer from "./admin/adminSlice";
import sellerReducer from "./seller/sellerSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    admin: adminReducer,
    seller: sellerReducer,
  },
});
