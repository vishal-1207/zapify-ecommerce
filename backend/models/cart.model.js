import { UUIDV4 } from "sequelize";

export default (sequelize, DataTypes) => {
  const Cart = sequelize.define("Cart", {
    id: { type: DataTypes.UUID, defaultValue: UUIDV4, primaryKey: true },
  });
  return Cart;
};
