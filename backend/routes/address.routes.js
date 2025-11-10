import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import * as addressController from "../controllers/address.controller.js";

const router = express.Router();
router.use(authenticate);

router
  .route("/")
  .get(addressController.getAddresses)
  .post(addressController.addAddress);

router
  .route("/:addressId")
  .patch(addressController.updateAddress)
  .delete(addressController.deleteAddress);

export default router;
