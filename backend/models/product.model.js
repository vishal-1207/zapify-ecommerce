import { nanoid } from "nanoid";
import { Op } from "sequelize";
import slugify from "slugify";
import { syncProductToAlgolia } from "../services/algolia.service";

export default (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "Product",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING, allowNull: false },
      model: { type: DataTypes.STRING, allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: false },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false }, // List price/MRP
      status: {
        type: DataTypes.ENUM("draft", "pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },
      slug: { type: DataTypes.STRING, allowNull: true, unique: true },

      averageRating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      reviewCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      minOfferPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      totalOfferStock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      offerCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      popularityScore: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      hooks: {
        afterCreate: async (product) => {
          syncProductToAlgolia(product.id).catch((e) => console.error(e));
        },
        afterUpdate: async (product) => {
          syncProductToAlgolia(product.id).catch((e) => console.error(e));
        },
        afterDestroy: async (product) => {
          deleteProductFromAlgolia(product.id).catch((e) => console.error(e));
        },
      },
    }
  );

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
