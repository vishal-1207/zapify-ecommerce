import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import * as productController from "../controllers/product.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { productSchema } from "../utils/validationSchema.js";
import { authorizeRoles } from "../middleware/authorizeRoles.middleware.js";

const router = express.Router();

router.route("/").post(
  authenticate,
  authorizeRoles("seller", "admin"),
  csrfProtection,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  validate(productSchema),
  productController.createProduct
);

router.route("/:slug").get(getProductDetails);
router
  .route("/:productId")
  .get(authorizeRoles("admin"), productController.getProductDetails);
router
  .route("/offerId")
  .get(authorizeRoles("seller"), productController.getProductOfferDetails);
router.route("/catalog-search").get(productController.searchCatalog);

router.route("/suggest-product").post(
  authorizeRoles("seller"),
  csrfProtection,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  validate(productSchema),
  productController.suggestNewProduct
);

router.route("/edit/:id").put(
  authenticate,
  authorizeRoles("seller", "admin"),
  csrfProtection,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  validate(productSchema),
  updateProduct
);

router
  .route("/:id")
  .delete(
    authenticate,
    authorizeRoles("seller", "admin"),
    csrfProtection,
    deleteProduct
  );

export default router;
