export default (sequelize, DataTypes) => {
  const OrderItem = sequelize.define("OrderItem", {
    id: { type: DataTypes.UUID, defaultValue: UUIDV4, primaryKey: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  });
  return OrderItem;
};
