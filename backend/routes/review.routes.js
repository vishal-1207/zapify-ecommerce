import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { reviewSchema } from "../utils/validationSchema.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";
import * as reviewControllers from "../controllers/reviews.controller.js";

const router = express.Router();
router.use(authenticate);

router.route("/product/:productId").get(reviewControllers.getReviewController);

router
  .route("/order-item/:orderItemId")
  .post(
    authorizeRoles("user"),
    csrfProtection,
    upload.array({ name: "gallery", maxCount: 5 }),
    validate(reviewSchema),
    reviewControllers.createReviewController
  );

router
  .route("/:reviewId")
  .patch(
    authorizeRoles("user"),
    csrfProtection,
    upload.array({ name: "gallery", maxCount: 5 }),
    validate(reviewSchema),
    reviewControllers.updateReviewController
  )
  .delete(
    authorizeRoles("user"),
    csrfProtection,
    reviewControllers.deleteReviewController
  );

export default router;
