import db from "./models/index.js";
import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);

app.get("/", (req, res, next) => {
  res.send("Hello world.");
  next();
});

db.sequelize.sync({ force: true }).then(() => {
  console.log("Database synced...");
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
});
