import express from "express";
import { validate } from "../middleware/validate.middleware.js";
import { searchStorefront } from "../controllers/search.controller.js";

const router = express.Router();

router.route("/q").get(searchStorefront);

export default router;
