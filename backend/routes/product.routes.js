import express from "express";
import { authenticate, isAdmin } from "../middleware/auth.middleware";
import { csrfProtection } from "../middleware/csrf.middleware";
import { upload } from "../middleware/multer.middleware";
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "../controllers/product.controller";

const router = express.Router();

// router.route("/").get();
// router.route("/product/:slug").get();

router.route("/id/:id").get(isAdmin);
router
  .route("/")
  .post(authenticate, isAdmin, csrfProtection, upload.array(), createProduct);

router
  .route("/id/:id")
  .put(authenticate, isAdmin, csrfProtection, upload.array(), updateProduct)
  .delete(authenticate, isAdmin, csrfProtection, deleteProduct);

export default router;
