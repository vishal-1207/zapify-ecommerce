import { nanoid } from "nanoid";
import slugify from "slugify";

export default (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "Product",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING, allowNull: false, unique: true },
      model: { type: DataTypes.STRING, allowNull: true, unique: true },
      description: { type: DataTypes.TEXT, allowNull: false },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
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
        beforeCreate: (product) => {
          if (!product.slug) {
            const combinedString =
              `${product.name} ${product.model || ""}`.trim();
            const baseSlug = slugify(combinedString, {
              lower: true,
              strict: true,
            });
            product.slug = `${baseSlug}-${nanoid(6)}`;
          }
        },
        beforeUpdate: (product) => {
          const combinedString =
            `${product.name} ${product.model || ""}`.trim();
          const baseSlug = slugify(combinedString, {
            lower: true,
            strict: true,
          });
          product.slug = `${baseSlug}-${nanoid(6)}`;
        },

        afterCreate: async (product) => {
          const { syncProductToAlgolia } =
            await import("../services/algolia.service.js");
          syncProductToAlgolia(product.id).catch((e) => console.error(e));
        },
        afterUpdate: async (product) => {
          const { syncProductToAlgolia } =
            await import("../services/algolia.service.js");
          syncProductToAlgolia(product.id).catch((e) => console.error(e));
        },
        afterDestroy: async (product) => {
          const { deleteProductFromAlgolia } =
            await import("../services/algolia.service.js");
          deleteProductFromAlgolia(product.id).catch((e) => console.error(e));
        },
      },
    },
  );

  Product.associate = (models) => {
    Product.belongsTo(models.Category, {
      foreignKey: "categoryId",
      as: "category",
    });
    Product.belongsTo(models.Brand, {
      foreignKey: "brandId",
      as: "brand",
    });
    Product.hasMany(models.Offer, {
      as: "offers",
      foreignKey: "productId",
      onDelete: "CASCADE",
    });
    Product.hasMany(models.ProductSpec, {
      as: "specs",
      foreignKey: "productId",
    });
    Product.hasMany(models.Review, { as: "reviews", foreignKey: "productId" });
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
