import db from "./models/index.js";
import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

app.get("/", (req, res) => {
  res.send("Hello world.");
});

app.use(errorHandler);

db.sequelize.sync({ force: false }).then(() => {
  console.log("Database synced...");
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
});
