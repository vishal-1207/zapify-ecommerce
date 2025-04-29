import db from "./models/index.js";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import tokenRoutes from "./routes/token.routes.js";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/token", tokenRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);

app.get("/", (req, res) => {
  res.send("Hello world.");
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await db.sequelize.sync({ force: true, alter: true });
    console.log("Database synced...");

    app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to sync database:", error);
    process.exit(1);
  }
};

startServer();
