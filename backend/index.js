import dotenv from "dotenv";
dotenv.config();

import express from "express";
import db from "./models/index.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);

app.get("/", (req, res, next) => {
  res.send("Hello world.");
  next();
});

db.sequelize.sync({ force: false }).then(() => {
  console.log("Database synced...");
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
});
