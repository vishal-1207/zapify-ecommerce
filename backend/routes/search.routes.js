import express from "express";
import { validate } from "../middleware/validate.middleware.js";
import { searchSchema } from "../utils/validationSchema.js";
import { getSearchResults } from "../controllers/search.controller.js";

const router = express.Router();

router.route("/q").get(validate(searchSchema), getSearchResults);

export default router;
