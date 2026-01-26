import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import * as userControllers from "../controllers/user.controller.js";
import csrfProtection from "../middleware/csrf.middleware.js";
import authorizeRoles from "../middleware/authorizeRoles.middleware.js";

const router = express.Router();
router.use(authenticate);

router
  .route("/profile")
  .get(authorizeRoles("user"), userControllers.getCurrentUserController);

router
  .route("/profile/edit")
  .patch(
    authorizeRoles("user"),
    csrfProtection,
    userControllers.updateProfileController,
  );

router
  .route("/profile/delete")
  .delete(
    authorizeRoles("user"),
    csrfProtection,
    userControllers.deleteUserController,
  );

export default router;
