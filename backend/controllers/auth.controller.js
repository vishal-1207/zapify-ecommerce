import db from "../models/index.js";
import * as authService from "../services/auth.service.js";

const User = db.User;

export const register = async (req, res) => {
  try {
    const user = await authService.createUser(req.body);
    res.status(201).json({ message: "User registered", user });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
};

export const login = async (req, res) => {};
