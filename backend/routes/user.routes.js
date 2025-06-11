import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { currentUserDetails } from "../controllers/user.controller.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";
import { updateProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.route("/me").get(authenticate, currentUserDetails);
router.route("/edit").put(authenticate, csrfProtection, updateProfile);

export default router;
