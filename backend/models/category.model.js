export default (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "Category",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING, allowNull: false, unique: true },
    },
    {
      hooks: {
        afterUpdate: async (category) => {
          const { reSyncProductsByCriteria } =
            await import("../services/algolia.service.js");
          reSyncProductsByCriteria({ categoryId: category.id });
        },
        afterDestroy: async (category) => {
          const { reSyncProductsByCriteria } =
            await import("../services/algolia.service.js");
          reSyncProductsByCriteria({ categoryId: category.id });
        },
      },
    },
  );

  Category.associate = (models) => {
    Category.hasMany(models.Product, {
      as: "products",
      foreignKey: "categoryId",
    });
    Category.hasOne(models.Media, {
      foreignKey: "associatedId",
      constraints: false,
      scope: { associatedType: "category" },
      as: "media",
    });
  };

  return Category;
};
