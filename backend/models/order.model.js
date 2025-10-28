export default (sequelize, DataTypes) => {
  const Order = sequelize.define("Order", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded"
      ),
      defaultValue: "pending",
    },
    shippingAddress: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  });

  Order.associate = (models) => {
    Order.belongsTo(models.User, { foreignKey: "userId" });
    Order.hasMany(models.OrderItem, {
      as: "OrderItems",
      foreignKey: "orderId",
      onDelete: "CASCADE",
    });
    Order.hasOne(models.Payment, {
      foreignKey: "orderId",
      onDelete: "CASCADE",
    });
  };

  return Order;
};
