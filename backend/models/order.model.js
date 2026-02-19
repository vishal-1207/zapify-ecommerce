export default (sequelize, DataTypes) => {
  const Order = sequelize.define("Order", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null for existing records, but new ones should have it
      unique: true,
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
        "cancelled",
      ),
      defaultValue: "pending",
    },
    shippingAddress: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  });

  Order.associate = (models) => {
    Order.belongsTo(models.User, { as: "user", foreignKey: "userId" });

    Order.belongsTo(models.Discount, {
      through: models.OrderDiscounts,
      foreignKey: "orderId",
      otherKey: "discountId",
      as: "appliedDiscount",
    });
    Order.hasMany(models.OrderItem, {
      as: "orderItems",
      foreignKey: "orderId",
      onDelete: "CASCADE",
    });
    Order.hasMany(models.Shipment, {
      as: "shipments",
      foreignKey: "orderId",
    });
    Order.hasOne(models.Payment, {
      as: "payments",
      foreignKey: "orderId",
      onDelete: "CASCADE",
    });
  };

  return Order;
};
