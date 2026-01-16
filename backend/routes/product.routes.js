import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import csrfProtection from "../middleware/csrf.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import * as productController from "../controllers/product.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  productSchema,
  suggestProductSchema,
} from "../utils/validationSchema.js";
import authorizeRoles from "../middleware/authorizeRoles.middleware.js";

const router = express.Router();

router.route("/:slug").get(productController.getProductDetailsForCustomer);

router.use(authenticate);

router.route("/").post(
  authorizeRoles("admin"),
  csrfProtection,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  validate(productSchema),
  productController.createProduct
);

router
  .route("/:productId")
  .get(authorizeRoles("admin"), productController.getProductDetailsAdmin)
  .patch(
    authorizeRoles("admin"),
    csrfProtection,
    upload.fields([
      { name: "thumbnail", maxCount: 1 },
      { name: "gallery", maxCount: 10 },
    ]),
    validate(productSchema),
    productController.updateProduct
  )
  .delete(
    authorizeRoles("admin"),
    csrfProtection,
    productController.deleteProduct
  );

router.route("/catalog-search").get(productController.searchCatalog);

router.route("/suggest-product/:sellerId").post(
  authorizeRoles("seller"),
  csrfProtection,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  validate(suggestProductSchema),
  productController.suggestNewProduct
);

router
  .route("/review/pending")
  .get(authorizeRoles("admin"), productController.getPendingProductsForReview);
router
  .route("/review/:productId")
  .patch(
    authorizeRoles("admin"),
    csrfProtection,
    productController.reviewProduct
  );

export default router;
