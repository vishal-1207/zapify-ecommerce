import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import * as wishlistController from "../controllers/wishlist.controller.js";

const router = express.Router();
router.use(authenticate);

router.route("/").get(wishlistController.getWishlist);
router.route("/add").post(wishlistController.addToWishlist);
router.route("/remove").delete(wishlistController.removeFromWishlist);

export default router;
