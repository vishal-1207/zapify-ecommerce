module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define("Order", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    totalAmount: { type: DataTypes.FLOAT, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "shipped", "paid"),
      defaultValue: "pending",
    },
  });
  return Order;
};
