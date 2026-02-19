import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import csrfProtection from "../middleware/csrf.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import * as productController from "../controllers/product.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  productSchema,
  suggestProductSchema,
  suggestProductFlatSchema,
} from "../utils/validationSchema.js";
import authorizeRoles from "../middleware/authorizeRoles.middleware.js";

const router = express.Router();

// 1. Specific Public Routes
router.route("/catalog-search").get(productController.searchCatalog);

// 2. Specific Protected Routes (prevent collision with :slug)
router.route("/suggestions").get(
  authenticate,
  authorizeRoles("seller"),
  productController.getProductSuggestions
);

// 3. Root Routes relative to /product
router
  .route("/")
  .get(productController.getAllProducts) // Public
  .post(
    authenticate,
    authorizeRoles("admin"),
    csrfProtection,
    upload.fields([
      { name: "thumbnail", maxCount: 1 },
      { name: "gallery", maxCount: 10 },
    ]),
    validate(productSchema),
    productController.createProduct,
  );

// 4. Generic Slug Route (Public) - Must be after specific single-segment routes
router.route("/:slug").get(productController.getProductDetailsForCustomer);

// 5. Other Protected Routes
router.route("/suggest-product/:sellerId").post(
  authenticate,
  authorizeRoles("seller"),
  csrfProtection,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  validate(suggestProductFlatSchema),
  productController.suggestNewProduct,
);

router
  .route("/a/:productId")
  .get(authenticate, authorizeRoles("admin"), productController.getProductDetailsAdmin)
  .patch(
    authenticate,
    authorizeRoles("admin"),
    csrfProtection,
    upload.fields([
      { name: "thumbnail", maxCount: 1 },
      { name: "gallery", maxCount: 10 },
    ]),
    validate(productSchema),
    productController.updateProduct,
  )
  .delete(
    authenticate,
    authorizeRoles("admin"),
    csrfProtection,
    productController.deleteProduct,
  );

router
  .route("/a/:productId/toggle-status")
  .patch(
    authenticate,
    authorizeRoles("admin"),
    csrfProtection,
    productController.toggleProductStatus
  );

router
  .route("/review/pending")
  .get(authenticate, authorizeRoles("admin"), productController.getPendingProductsForReview);
router
  .route("/review/:productId")
  .patch(
    authenticate,
    authorizeRoles("admin"),
    csrfProtection,
    productController.reviewProduct,
  );

export default router;
