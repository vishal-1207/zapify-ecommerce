const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const db = require("./models/");
const authRoutes = require("./routes/auth.routes");
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
