import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import csrfProtection from "../middleware/csrf.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { discountSchema } from "../utils/validationSchema.js";
import authorizeRoles from "../middleware/authorizeRoles.middleware.js";
import * as discountController from "../controllers/discount.controller.js";

const router = express.Router();

router
  .route("/apply")
  .post(authenticate, csrfProtection, discountController.applyDiscountToCart);

router
  .route("/remove")
  .post(authenticate, discountController.removeDiscountFromCart);
router
  .route("/available")
  .get(authenticate, discountController.getAvailableCoupons);

// Seller Deal Routes
router.post(
  "/seller-deal/:offerId",
  authenticate,
  authorizeRoles("seller"),
  discountController.createSellerDeal,
);

router.use(authenticate, authorizeRoles("admin"));

router
  .route("/")
  .get(discountController.getDiscounts)
  .post(
    csrfProtection,
    validate(discountSchema),
    discountController.createDiscount,
  );

router
  .route("/:id")
  .get(discountController.getDiscount)
  .patch(csrfProtection, discountController.updateDiscount)
  .delete(discountController.deleteDiscount);

router.patch("/:id/toggle", discountController.toggleStatus);

export default router;
