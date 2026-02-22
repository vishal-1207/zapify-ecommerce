export default (sequelize, DataTypes) => {
  const Payment = sequelize.define("Payment", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: "INR",
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "succeeded", "failed", "refunded"),
      allowNull: false,
      defaultValue: "pending",
    },
    gatewayTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    paymentGateway: { type: DataTypes.STRING, defaultValue: "Stripe" },
    paymentMethod: { type: DataTypes.STRING, allowNull: true },
    paymentMethodDetails: { type: DataTypes.JSON, allowNull: true },
    failureCode: { type: DataTypes.STRING, allowNull: true },
    failureMessage: { type: DataTypes.TEXT, allowNull: true },
    refundAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    gatewayResponse: { type: DataTypes.JSON, allowNull: true },
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.Order, {
      foreignKey: "orderId",
      onDelete: "CASCADE",
    });
  };

  return Payment;
};
