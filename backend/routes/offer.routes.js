import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.middleware.js";
import { offerSchema } from "../utils/validationSchema.js";
import { validate } from "../middleware/validate.middleware.js";
import * as offerController from "../controllers/offer.controller.js";

const router = express.Router;
router.use(authenticate);

router
  .route("/product/:productId")
  .post(
    authenticate,
    authorizeRoles("seller"),
    validate(offerSchema),
    offerController.createOffer
  );

router
  .route("/:offerId")
  .get(
    authenticate,
    authorizeRoles("seller"),
    productController.getProductOfferDetails
  )
  .patch(
    authenticate,
    authorizeRoles("seller"),
    validate(offerSchema),
    offerController.updateProductOffer
  )
  .delete(authorizeRoles("seller"), offerController.deleteOffer);

export default router;
