import express from "express";

const router = express.Router();

router.route("/q").get(searchProducts);

export default router;
