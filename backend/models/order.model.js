export default (sequelize, DataTypes) => {
  const Order = sequelize.define("Order", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    uniqueOrderId: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null for existing records, but new ones should have it
      unique: true,
    },
    mrp: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    subtotalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    deliveryFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "processed",
        "shipped",
        "delivered",
        "cancelled",
        "return_requested",
      ),
      defaultValue: "pending",
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    affiliateId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    affiliateCommission: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    shippingAddress: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 18.0, // Standard 18% GST
    },
  });

  Order.associate = (models) => {
    Order.belongsTo(models.User, { as: "user", foreignKey: "userId" });

    Order.belongsToMany(models.Discount, {
      through: models.OrderDiscounts,
      foreignKey: "orderId",
      otherKey: "discountId",
      as: "discounts",
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
    Order.belongsTo(models.AffiliateProfile, {
      as: "affiliate",
      foreignKey: "affiliateId",
    });
  };

  return Order;
};
