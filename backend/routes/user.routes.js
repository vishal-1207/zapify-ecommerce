import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { currentUserDetails } from "../controllers/user.controller.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";
import { updateProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.route("/profile").get(authenticate, currentUserDetails);
router
  .route("/profile/edit")
  .patch(authenticate, csrfProtection, updateProfile);

export default router;
