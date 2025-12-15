import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import * as addressController from "../controllers/address.controller.js";

const router = express.Router();
router.use(authenticate);

router
  .route("/customer/")
  .get(addressController.getCustomerAddresses)
  .post(addressController.addCustomerAddress);

router
  .route("/seller/")
  .get(addressController.getSellerAddresses)
  .post(addressController.addSellerAddress);

router
  .route("/customer/:addressId")
  .patch(addressController.updateCustomerAddress)
  .delete(addressController.deleteCustomerAddress);

router
  .route("/seller/:addressId")
  .patch(addressController.updateSellerAddress)
  .delete(addressController.deleteSellerAddress);

export default router;
