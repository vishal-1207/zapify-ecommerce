import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import * as settingControllers from "../controllers/settings.controller.js";
import authorizeRoles from "../middleware/authorizeRoles.middleware.js";

const router = express.Router();
router.use(authenticate);

router
  .route("/user/:username")
  .patch(authorizeRoles("user"), settingControllers.updateUserSettings);

router
  .route("/seller/:sellerName")
  .patch(authorizeRoles("seller"), settingControllers.updateSellerSettings);

export default router;
