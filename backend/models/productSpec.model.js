import { UUIDV4 } from "sequelize";

export default (sequelize, DataTypes) => {
  const ProductSpec = sequelize.define("ProductSpec", {
    id: { type: DataTypes.UUID, defaultValue: UUIDV4, primaryKey: true },
    key: { type: DataTypes.STRING, allowNull: false },
    value: { type: DataTypes.STRING, allowNull: false },
  });
  return ProductSpec;
};
