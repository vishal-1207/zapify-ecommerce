export default (sequelize, DataTypes) => {
  const Order = sequelize.define("Order", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled"
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

    Order.belongsTo(models.Discounts, {
      through: models.OrderDiscounts,
      foreignKey: "orderId",
      otherKey: "discountId",
      as: "appliedDiscount",
    });
    Order.hasMany(models.OrderItem, {
      as: "OrderItems",
      foreignKey: "orderId",
      onDelete: "CASCADE",
    });
    Order.hasMany(models.Shipment, {
      as: "Shipments",
      foreignKey: "orderId",
    });
    Order.hasOne(models.Payment, {
      foreignKey: "orderId",
      onDelete: "CASCADE",
    });
  };

  return Order;
};
