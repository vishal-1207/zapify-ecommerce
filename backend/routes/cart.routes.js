import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import * as cartController from "../controllers/cart.controller.js";

const router = express.Router();
router.use(authenticate);

router
  .route("/")
  .get(cartController.getCartDetails)
  .post(cartController.addItem)
  .delete(cartController.emptyCart);

router
  .route("/:offerId")
  .patch(cartController.updateItem)
  .delete(cartController.removeItem);

export default router;
