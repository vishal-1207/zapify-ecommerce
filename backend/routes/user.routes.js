import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { currentUserDetails } from "../controllers/user.controller.js";

const router = express.Router();

router.route("/me").post(authenticate, currentUserDetails);

export default router;
