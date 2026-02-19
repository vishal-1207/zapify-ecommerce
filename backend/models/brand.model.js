export default (sequelize, DataTypes) => {
  const Brand = sequelize.define(
    "Brand",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      slug: { type: DataTypes.STRING, allowNull: true, unique: true },
    },
    {
      hooks: {
        beforeCreate: (brand) => {
          if (!brand.slug && brand.name) {
             const slugify = require("slugify");
             const { nanoid } = require("nanoid");
             brand.slug = `${slugify(brand.name, { lower: true, strict: true })}-${nanoid(6)}`;
          }
        },
        beforeUpdate: (brand) => {
             if (brand.changed("name")) {
                const slugify = require("slugify");
                const { nanoid } = require("nanoid");
                brand.slug = `${slugify(brand.name, { lower: true, strict: true })}-${nanoid(6)}`;
             }
        },
        afterUpdate: async (brand) => {
          const { reSyncProductsByCriteria } =
            await import("../services/algolia.service.js");
          reSyncProductsByCriteria({ brandId: brand.id });
        },
        afterDestroy: async (brand) => {
          const { reSyncProductsByCriteria } =
            await import("../services/algolia.service.js");
          reSyncProductsByCriteria({ brandId: brand.id });
        },
      },
      indexes: [
        { unique: true, fields: ["name"], name: "brands_name_unique" },
        { fields: ["isActive"] },
      ],
    },
  );

  Brand.associate = (models) => {
    Brand.hasMany(models.Product, { as: "products", foreignKey: "brandId" });
    Brand.hasOne(models.Media, {
      foreignKey: "associatedId",
      constraints: false,
      scope: { associatedType: "brand" },
      as: "media",
    });
  };

  return Brand;
};
