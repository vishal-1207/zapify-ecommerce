import express from "express";

const router = express.Router();

router.route("/").get();
router.route("/:id").get();
router.route("/").post();
router.route("/:id").put();
router.route("/:id").delete();

export default router;
