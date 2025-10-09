import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { userSettingsSchema } from "../utils/validationSchema.js";
import * as settingControllers from "../controllers/settings.controller.js";

const router = express.Router();
router.use(authenticate);

router
  .route("/")
  .get(settingControllers.getUserSettings)
  .patch(validate(userSettingsSchema), settingControllers.updateUserSettings);

export default router;
