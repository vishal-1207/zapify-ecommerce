import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import csrfProtection from "../middleware/csrf.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { discountSchema } from "../utils/validationSchema.js";
import authorizeRoles from "../middleware/authorizeRoles.middleware";
import * as discountController from "../controllers/discount.controller.js";

const router = express.Router();

router
  .route("/apply")
  .post(authenticate, csrfProtection, discountController.applyDiscountToCart);

router.use(authenticate, authorizeRoles("admin"));

router
  .route("/")
  .get(discountController.getDiscounts)
  .post(
    csrfProtection,
    validate(discountSchema),
    discountController.createDiscount
  );

router
  .route("/:id/toggle")
  .patch(csrfProtection, discountController.toggleStatus);

export default router;
