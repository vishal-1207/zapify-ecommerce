import db from "../models/index.js";
import asyncHandler from "../utils/asyncHandler.js";

export const currentUserDetails = asyncHandler(async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});
