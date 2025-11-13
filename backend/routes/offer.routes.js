import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.middleware.js";
import { offerSchema } from "../utils/validationSchema.js";
import { validate } from "../middleware/validate.middleware.js";
import * as offerController from "../controllers/offer.controller.js";
import * as productController from "../controllers/product.controller.js";
import { csrfProtection } from "../middleware/csrf.middleware.js";

const router = express.Router();
router.use(authenticate);

router.route("/").get(authorizeRoles("seller"), offerController.getOffers);

router
  .route("/product/:productId")
  .post(
    authorizeRoles("seller"),
    csrfProtection,
    validate(offerSchema),
    offerController.createOffer
  );

router
  .route("/:offerId")
  .get(authorizeRoles("seller"), productController.getProductOfferDetails)
  .patch(
    authorizeRoles("seller"),
    csrfProtection,
    validate(offerSchema),
    offerController.updateProductOffer
  )
  .delete(
    authorizeRoles("seller"),
    csrfProtection,
    offerController.deleteOffer
  );

export default router;
