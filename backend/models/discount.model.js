export default (sequelize, DataTypes) => {
  const Discount = sequelize.define("Discount", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: "The coupon code the user enters, e.g., SUMMER20",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    discountType: {
      type: DataTypes.ENUM("percentage", "fixed"),
      allowNull: false,
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment:
        "The discount amount (e.g., 20.00 for percentage, or 500.00 for fixed",
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    usageLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  });

  Discount.associate = (models) => {
    Discount.belongsToMany(models.Order, {
      through: "OrderDiscounts",
      foreignKey: "discountId",
      otherKey: "orderId",
    });
  };

  return Discount;
};
