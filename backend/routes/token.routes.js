import express from "express";
import { csrfToken } from "../controllers/token.controller.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";

const router = express.Router();

router.route("/csrf-token").get(csrfToken);

export default router;
