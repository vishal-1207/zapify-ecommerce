export default (sequelize, DataTypes) => {
  const Order = sequelize.define("Order", {
    id: { type: DataTypes.UUID, defaultValue: UUIDV4, primaryKey: true },
    totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "paid",
        "shipped",
        "delivered",
        "cancelled",
        "refunded"
      ),
      defaultValue: "pending",
    },
  });
  return Order;
};
