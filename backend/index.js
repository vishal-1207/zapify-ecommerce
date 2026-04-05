import db from "./models/index.js";
import express from "express";
import pino from "pino-http";
import compression from "compression";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import redisClient from "./config/redis.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";
import sellerRoutes from "./routes/seller.routes.js";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import brandRoutes from "./routes/brand.routes.js";
import discountRoutes from "./routes/discount.routes.js";
import errorHandler from "./middleware/error.middleware.js";
import tokenRoutes from "./routes/token.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import addressRoutes from "./routes/address.routes.js";
import searchRoutes from "./routes/search.routes.js";
import offerRoutes from "./routes/offer.routes.js";
import orderRoutes from "./routes/order.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import affiliateRoutes from "./routes/affiliate.routes.js";
import { startCleanupService } from "./services/cleanup.service.js";
import { startModerationWorker } from "./workers/moderation.worker.js";
import otpRoutes from "./routes/otp.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import passport from "passport";
import fs from "fs";
import cors from "cors";
import initializePassport from "./config/passport.js";

const app = express();

const PORT = parseInt(process.env.PORT, 10) || 3000;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(helmet());
app.use(
  pino(
    process.env.NODE_ENV === "development"
      ? {
          level: "info",
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
            },
          },
        }
      : {},
  ),
);
app.use(
  compression({
    level: 6,
    threshold: 100,
  }),
);
app.use(cookieParser());
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payment/webhook") return next();
  express.json()(req, res, next);
});
app.use(express.urlencoded({ extended: true }));

initializePassport();
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/token", tokenRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/brand", brandRoutes);
app.use("/api/product", productRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/offer", offerRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/affiliate", affiliateRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/discount", discountRoutes);

app.get("/", (req, res) => {
  res.send("Hello world.");
});

app.use(errorHandler);

const startServer = async () => {
  try {
    if (!fs.existsSync("uploads")) {
      console.log("⏳ Creating 'uploads' directory...");
      fs.mkdirSync("uploads");
      console.log("✅ 'uploads' directory created.");
    }

    try {
      await redisClient.ping();
      console.log("Redis client connected...");
    } catch (redisErr) {
      console.warn(
        "⚠️ Redis client failed to connect on startup. The application will continue running with degraded cache/features, while Redis attempts to reconnect in the background.",
      );
      console.warn("Redis Error:", redisErr.message);
    }

    await db.sequelize.sync();
    console.log("Database synced...");

    try {
      const [[columnInfo]] = await db.sequelize.query(
        `SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME   = 'ProductSpecs'
           AND COLUMN_NAME  = 'value'`,
      );
      if (columnInfo && columnInfo.DATA_TYPE === "varchar") {
        await db.sequelize.query(
          `ALTER TABLE \`ProductSpecs\` MODIFY COLUMN \`value\` TEXT NOT NULL`,
        );
        console.log("✅ Migration: ProductSpecs.value widened to TEXT.");
      }
    } catch (migrationErr) {
      console.warn(
        "⚠️ Migration check failed (non-fatal):",
        migrationErr.message,
      );
    }

    startCleanupService();
    startModerationWorker();

    app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to sync database:", error);
    process.exit(1);
  }
};

startServer();
