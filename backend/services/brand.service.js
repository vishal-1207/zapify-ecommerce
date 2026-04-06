import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import cloudinary from "../config/cloudinary.js";
import { processBackgroundUpload } from "./worker.service.js";
import slugify from "slugify";
import { nanoid } from "nanoid";

export const getAllBrands = async ({ includeInactive = false } = {}) => {
  const where = {};
  if (!includeInactive) {
    where.isActive = true;
  }

  const brands = await db.Brand.findAll({
    where,
    attributes: ["id", "name", "slug", "description", "isActive"],
    order: [["name", "ASC"]],
    include: [
      {
        model: db.Media,
        as: "media",
        attributes: ["id", "publicId", "url", "fileType", "tag"],
        where: { associatedType: "brand" },
        required: false,
      },
    ],
  });

  for (const brand of brands) {
    if (!brand.slug) {
      const newSlug = `${slugify(brand.name, { lower: true, strict: true })}-${nanoid(6)}`;
      brand.slug = newSlug;
      await db.Brand.update({ slug: newSlug }, { where: { id: brand.id } });
    }
  }

  return brands;
};

export const addBrandService = async (data, file) => {
  const { name, description } = data;

  const existingBrand = await db.Brand.findOne({ where: { name } });
  if (existingBrand) throw new ApiError(409, "Brand already exists.");

  const transaction = await db.sequelize.transaction();

  try {
    const brand = await db.Brand.create(
      { name, description },
      { transaction },
    );

    await transaction.commit();

    // Fire image upload asynchronously after DB commit — response returns immediately.
    if (file) {
      processBackgroundUpload({
        filePath: file.path,
        folder: process.env.CLOUDINARY_BRAND_FOLDER,
        associatedType: "brand",
        associatedId: brand.id,
        tag: "thumbnail",
      }).catch((err) =>
        console.error(`[Upload] Brand image failed for ${brand.id}:`, err),
      );
    }

    return { brand, media: null };
  } catch (dbError) {
    await transaction.rollback();
    if (dbError instanceof ApiError) throw dbError;
    if (dbError.name === "SequelizeUniqueConstraintError") {
      throw new ApiError(409, "Brand name or slug must be unique.");
    }
    throw new ApiError(500, dbError.message || "Failed to create brand.");
  }
};

export const updateBrandService = async (id, data, file) => {
  const { name, description } = data;

  const existingBrand = await db.Brand.findByPk(id, {
    include: ["media"],
  });

  if (!existingBrand) {
    throw new ApiError(404, "Brand not found.");
  }

  if (name && name !== existingBrand.name) {
    const conflict = await db.Brand.findOne({ where: { name } });
    if (conflict && conflict.id !== id) {
      throw new ApiError(409, "Brand with this name already exists.");
    }
  }

  const transaction = await db.sequelize.transaction();

  try {
    if (name) existingBrand.name = name;
    if (description) existingBrand.description = description;

    if (file && existingBrand.media) {
      // The background upload worker will update the brand media
    }

    await existingBrand.save({ transaction });
    await transaction.commit();

    // Fire new image upload asynchronously after commit
    if (file) {
      processBackgroundUpload({
        filePath: file.path,
        folder: process.env.CLOUDINARY_BRAND_FOLDER,
        associatedType: "brand",
        associatedId: existingBrand.id,
        tag: "thumbnail",
      }).catch((err) =>
        console.error(
          `[Upload] Brand update image failed for ${existingBrand.id}:`,
          err,
        ),
      );
    }

    return { brand: existingBrand, media: null };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ApiError) throw error;
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ApiError(409, "Brand name must be unique.");
    }
    throw new ApiError(500, error.message || "Failed to update brand.");
  }
};

export const deleteBrandService = async (id) => {
  const brand = await db.Brand.findByPk(id, { include: ["media"] });
  if (!brand) throw new ApiError(404, "Brand not found.");

  const transaction = await db.sequelize.transaction();

  try {
    if (brand.media) {
      if (brand.media.publicId) {
        await cloudinary.uploader.destroy(brand.media.publicId);
      }
      await brand.media.destroy({ transaction });
    }

    await brand.destroy({ transaction });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw new ApiError(500, "Failed to delete brand.", error);
  }
};

export const toggleBrandStatus = async (id) => {
  const brand = await db.Brand.findByPk(id);
  if (!brand) throw new ApiError(404, "Brand not found.");

  brand.isActive = !brand.isActive;
  await brand.save();

  return brand;
};
