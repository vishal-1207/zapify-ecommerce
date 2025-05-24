import { nanoid } from "nanoid";
import { Op } from "sequelize";
import slugify from "slugify";

export default (sequelize, DataTypes) => {
  const Product = sequelize.define("Product", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    stock: { type: DataTypes.INTEGER, defaultValue: 0 },
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

  return Product;
};
