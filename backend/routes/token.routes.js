import express from "express";
import { csrfToken } from "../controllers/token.controller.js";

const router = express.Router();

router.route("/csrf-token").get(csrfToken);

export default router;
