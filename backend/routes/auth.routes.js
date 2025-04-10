import express from "express";
import { login, register } from "../controllers/auth.controller.js";

const router = express.Router();

// router.post("/register", register);
router.route("/register").post(register);
// router.post("/login", login);
router.route("/login").post(login);
// router.post('/logout')

export default router;
