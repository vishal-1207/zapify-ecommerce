import db from "./models/index.js";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import brandRoutes from "./routes/brand.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import tokenRoutes from "./routes/token.routes.js";
import userSettingsRoutes from "./routes/settings.routes.js";
import searchRoutes from "./routes/search.routes.js";
import offerRoutes from "./routes/offer.routes.js";
import { startCleanupService } from "./services/cleanup.service.js";
import passport from "passport";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/token", tokenRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/brand", brandRoutes);
app.use("/api/product", productRoutes);
app.use("/api/offer", offerRoutes);
// app.use("/api/cart", cartRoutes);
// app.use("/api/order", orderRoutes);
// app.use("/api/payment", paymentRoutes);
// app.use("/api/seller", sellerRoutes);
// app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", userSettingsRoutes);
app.use("/api/search", searchRoutes);

app.get("/", (req, res) => {
  res.send("Hello world.");
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await db.sequelize.sync({ force: false });
    console.log("Database synced...");

    startCleanupService();

    app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to sync database:", error);
    process.exit(1);
  }
};

startServer();
