import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  currentUserDetails,
  deleteUser,
} from "../controllers/user.controller.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";
import { updateProfile } from "../controllers/user.controller.js";
import { authorizeRoles } from "../middleware/authorizeRoles.middleware.js";

const router = express.Router();

router
  .route("/profile")
  .get(authenticate, authorizeRoles("user"), currentUserDetails);

router
  .route("/profile/edit")
  .patch(authenticate, authorizeRoles("user"), csrfProtection, updateProfile);

router
  .route("/profile/delete")
  .delete(authenticate, authorizeRoles("user"), csrfProtection, deleteUser);

export default router;
