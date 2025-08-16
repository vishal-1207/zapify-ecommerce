import express from "express";
import { validate } from "../middleware/validate.middleware";
import { searchSchema } from "../utils/validationSchema";

const router = express.Router();

router.route("/q").get(validate(searchSchema), searchProducts);

export default router;
