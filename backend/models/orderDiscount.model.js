export default (sequelize, DataTypes) => {
  const OrderDiscounts = sequelize.define(
    "OrderDiscounts",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      discountId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      appliedAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment:
          "Stores the exact amount saved at the moment of order placement.",
      },
    },
    {
      indexes: [{ fields: ["orderId"] }, { fields: ["discountId"] }],
    },
  );

  OrderDiscounts.associate = (models) => {
    OrderDiscounts.belongsTo(models.Order, {
      foreignKey: "orderId",
      as: "order",
    });

    OrderDiscounts.belongsTo(models.Discount, {
      foreignKey: "discountId",
      as: "discountDetails",
    });
  };

  return OrderDiscounts;
};
