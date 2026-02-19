export default (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "Category",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING, allowNull: false },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      slug: { type: DataTypes.STRING, allowNull: true, unique: true },
    },
    {
      paranoid: true,
      hooks: {
        beforeCreate: (category) => {
          if (!category.slug && category.name) {
             const slugify = require("slugify");
             const { nanoid } = require("nanoid");
             category.slug = `${slugify(category.name, { lower: true, strict: true })}-${nanoid(6)}`;
          }
        },
        beforeUpdate: (category) => {
             if (category.changed("name")) {
                const slugify = require("slugify");
                const { nanoid } = require("nanoid");
                category.slug = `${slugify(category.name, { lower: true, strict: true })}-${nanoid(6)}`;
             }
        },
        afterUpdate: async (category) => {
          const { reSyncProductsByCriteria } =
            await import("../services/algolia.service.js");
          reSyncProductsByCriteria({ categoryId: category.id });
        },
      },
      indexes: [
        { unique: true, fields: ["name"], name: "categories_name_unique" },
        { fields: ["isActive"] },
      ],
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
