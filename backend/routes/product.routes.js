import express from "express";
import { authenticate, isAdmin } from "../middleware/auth.middleware.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "../controllers/product.controller.js";

const router = express.Router();

// router.route("/").get();
// router.route("/product/:slug").get();

// router.route("/id/:id").get(isAdmin);
router.route("/").post(
  authenticate,
  isAdmin,
  csrfProtection,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  createProduct
);

router
  .route("/id/:id")
  .put(
    authenticate,
    isAdmin,
    csrfProtection,
    upload.fields([
      { name: "thumbnail", maxCount: 1 },
      { name: "gallery", maxCount: 10 },
    ]),
    updateProduct
  )
  .delete(authenticate, isAdmin, csrfProtection, deleteProduct);

export default router;
