export default (sequelize, DataTypes) => {
  const Discount = sequelize.define(
    "Discount",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        set(value) {
          this.setDataValue("code", value.toUpperCase());
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      discountType: {
        type: DataTypes.ENUM("percentage", "flat"),
        allowNull: false,
      },
      value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment:
          "The discount amount (e.g., 20.00 for percentage, or 500.00 for flat off)",
      },
      minOrderAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      maxDiscountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      usageLimit: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      usagePerUsage: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      paranoid: true,
      indexes: [
        { fields: ["code"] },
        { fields: ["isActive"] },
        { fields: ["expiresAt"] },
      ],
    },
  );

  Discount.associate = (models) => {
    Discount.belongsToMany(models.Order, {
      through: "OrderDiscounts",
      foreignKey: "discountId",
      otherKey: "orderId",
      as: "orders",
    });
    Discount.hasMany(models.OrderDiscounts, {
      foreignKey: "discountId",
      as: "orderDiscounts",
    });
  };

  return Discount;
};
