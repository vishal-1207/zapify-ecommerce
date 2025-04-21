import db from "./models/index.js";
import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import tokenRoutes from "./routes/token.routes.js";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("api/token", tokenRoutes);
app.use("/api/user", userRoutes);
app.use("/api/store", productRoutes);

app.get("/", (req, res) => {
  res.send("Hello world.");
});

app.use(errorHandler);

db.sequelize.sync({ force: false, alter: true }).then(() => {
  console.log("Database synced...");
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
});
