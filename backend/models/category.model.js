import { Op } from "sequelize";
import slugify from "slugify";

export default (sequelize, DataTypes) => {
  const Category = sequelize.define("Category", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    slug: { type: DataTypes.STRING, allowNull: true, unique: true },
  });

  Category.beforeCreate(async (category, options) => {
    const baseSlug = slugify(category.name, {
      lower: true,
      strict: true,
    });

    const existing = await Category.findOne({ where: { slug: baseSlug } });
    if (existing) {
      throw new Error("Slug already exists for another category.");
    }

    category.slug = baseSlug;
  });

  Category.beforeUpdate(async (category, options) => {
    if (category.changed("name")) {
      const baseSlug = slugify(category.name, {
        lower: true,
        strict: true,
      });

      const existing = await Category.findOne({
        where: { slug: baseSlug, id: { [Op.ne]: category.id } },
      });
      if (existing) {
        throw new Error("Slug already exists for another category.");
      }

      category.slug = baseSlug;
    }
  });

  Category.associate = (models) => {
    Category.hasMany(models.Product, { foreignKey: "categoryId" });
    Category.hasOne(models.Media, {
      foreignKey: "associatedId",
      constraints: false,
      scope: { associatedType: "category" },
      as: "media",
      onDelete: "CASCADE",
    });
  };
  return Category;
};
