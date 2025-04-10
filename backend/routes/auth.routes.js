import express from "express";
import { register } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
// router.post('/login', authController.login);
// router.post('/logout')

export default router;
