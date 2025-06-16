import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { userSettingsSchema } from "../utils/validationSchema.js";

const router = express.Router();

router
  .route("/")
  .get(authenticate, getUserSettings)
  .patch(authenticate, validate(userSettingsSchema), updateUserSettings);

export default router;
