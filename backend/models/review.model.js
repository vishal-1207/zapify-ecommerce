import { UUIDV4 } from "sequelize";

export default (sequelize, DataTypes) => {
  const Review = sequelize.define(
    "Review",
    {
      id: { type: DataTypes.UUID, defaultValue: UUIDV4, primaryKey: true },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Products", key: "id" },
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
  return Review;
};
