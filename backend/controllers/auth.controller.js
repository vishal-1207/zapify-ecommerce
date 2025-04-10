import db from "../models/index.js";
import * as authService from "../services/auth.service.js";

export const register = async (req, res) => {
  try {
    const user = await authService.createUser(req.body);
    res.status(201).json({ message: "User registered", user });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const result = await authService.findUser(req.body);
    res.status(200).json({ message: "Login successfull", result });
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: err.message });
  }
};
