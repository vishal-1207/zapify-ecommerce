import { nanoid } from "nanoid";
import { Op } from "sequelize";
import slugify from "slugify";

export default (sequelize, DataTypes) => {
  const Product = sequelize.define("Product", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    model: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2), // e.g., 4.50
      allowNull: true,
      defaultValue: 0.0,
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    slug: { type: DataTypes.STRING, allowNull: true, unique: true },
  });

  Product.beforeCreate(async (product, options) => {
    const baseSlug = slugify(product.name, { lower: true, strict: true });
    let finalSlug = `${baseSlug}-${nanoid(6)}`;
    const exists = await Product.findOne({ where: { slug: finalSlug } });
    if (exists) {
      finalSlug = `${baseSlug}-${nanoid(6)}`;
    }

    product.slug = finalSlug;
  });

  Product.beforeUpdate(async (product, options) => {
    if (product.changed("name")) {
      const baseSlug = slugify(product.name, {
        lower: true,
        strict: true,
      });
      let finalSlug = `${baseSlug}-${nanoid(6)}`;

      const exists = await Product.findOne({
        where: { slug: finalSlug, id: { [Op.ne]: product.id } },
      });

      if (exists) {
        finalSlug = `${baseSlug}-${nanoid(6)}`;
      }

      product.slug = finalSlug;
    }
  });

  Product.associate = (models) => {
    Product.belongsTo(models.Category, { foreignKey: "categoryId" });
    Product.belongsTo(models.Brand, { foreignKey: "brandId" });
    Product.hasMany(models.Offer, {
      as: "Offers",
      foreignKey: "productId",
      onDelete: "CASCADE",
    });
    Product.hasMany(models.ProductSpec, { foreignKey: "productId" });
    Product.hasMany(models.Review, { foreignKey: "productId" });
    Product.hasMany(models.Media, {
      foreignKey: "associatedId",
      constraints: false,
      scope: { associatedType: "product" },
      as: "media",
    });
    Product.belongsToMany(models.User, {
      foreignKey: "productId",
      through: models.WishList,
      otherKey: "userId",
      as: "wishListedByUsers",
      onDelete: "CASCADE",
    });
  };

  return Product;
};
