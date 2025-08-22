import { readdirSync } from "fs";
import { basename as _basename, join } from "path";
import { Sequelize, DataTypes } from "sequelize";
import { fileURLToPath } from "url";
import sequelize from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");
const basename = _basename(__filename);
const db = {};

const files = readdirSync(__dirname).filter(
  (file) =>
    file.indexOf(".") !== 0 &&
    file !== basename &&
    file.slice(-9) === ".model.js"
);

for await (const file of files) {
  const modelModule = await import(join("file://", __dirname, file));
  const model = modelModule.default(sequelize, DataTypes);
  db[model.name] = model;
}

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.Sequelize = Sequelize;
db.sequelize = sequelize;

export default db;
