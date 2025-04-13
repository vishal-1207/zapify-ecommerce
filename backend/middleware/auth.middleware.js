import jwt from "jsonwebtoken";

export const authenticate = async (req, res, next) => {
  try {
    const token =
      req.cookie?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Access token missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.log("Auth middleare error: ", error.message);
    res.status(403).json({ message: "Invalid or expire token." });
  }
};

export const isAdmin = async (req, res, next) => {
  if (req.body.role !== "admin") {
    return res.status(403).json({ message: "Access denied." });
  }
  next();
};
