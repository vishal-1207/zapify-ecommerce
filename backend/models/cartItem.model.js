export default (sequelize, DataTypes) => {
  const CartItem = sequelize.define("CartItem", {
    id: { type: DataTypes.UUID, defaultValue: UUIDV4, primaryKey: true },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  });
  return CartItem;
};
