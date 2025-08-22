export default (sequelize, DataTypes) => {
  const Review = sequelize.define(
    "Review",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      rating: { type: DataTypes.INTEGER, allowNull: false },
      comment: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["userId", "productId"],
        },
      ],
      tableName: "reviews",
      timestamps: true,
    }
  );

  Review.associate = (models) => {
    Review.belongsTo(models.User, { foreignKey: "userId" });
    Review.belongsTo(models.Product, {
      foreignKey: "productId",
      as: "product",
    });
    Review.hasMany(models.Media, {
      foreignKey: "associatedId",
      constraints: false,
      scope: { associatedType: "review" },
      as: "media",
    });
  };

  return Review;
};
