export default (sequelize, DataTypes) => {
  const Review = sequelize.define("Review", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    comment: { type: DataTypes.TEXT, allowNull: true },
    orderItemId: { type: DataTypes.UUID, allowNull: false, unique: true },
  });

  Review.associate = (models) => {
    Review.belongsTo(models.User, { foreignKey: "userId" });
    Review.belongsTo(models.Product, {
      foreignKey: "productId",
    });
    Review.belongsTo(models.OrderItem, {
      foreignKey: "orderItemId",
    });
    Review.hasMany(models.Media, {
      foreignKey: "associatedId",
      constraints: false,
      scope: { associatedType: "review" },
      as: "media",
      onDelete: "CASCADE",
    });
  };

  return Review;
};
