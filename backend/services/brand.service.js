import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import uploadToCloudinary from "../utils/cloudinary.util.js";
import cloudinary from "../config/cloudinary.js";
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
        where: {
          associatedType: "brand",
        },
        required: false,
      },
    ],
  });

  // Self-healing: Check for missing slugs and update them
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

  const existingBrand = await db.Brand.findOne({
    where: { name },
  });

  if (existingBrand) throw new ApiError(409, "Brand already exists.");

  let uploadResult = null;

  // 1. Upload to Cloudinary first (outside transaction)
  if (file) {
    try {
      uploadResult = await uploadToCloudinary(
        file.path,
        process.env.CLOUDINARY_BRAND_FOLDER,
      );
    } catch (uploadError) {
      throw new ApiError(500, "Failed to upload image.");
    }
  }

  // 2. Start Transaction
  const transaction = await db.sequelize.transaction();

  try {
    const brand = await db.Brand.create(
      {
        name,
        description,
      },
      { transaction },
    );

    let media;
    if (uploadResult) {
      media = await db.Media.create(
        {
          publicId: uploadResult.public_id,
          url: uploadResult.secure_url,
          fileType: uploadResult.resource_type,
          tag: "thumbnail",
          associatedType: "brand",
          associatedId: brand.id,
        },
        { transaction },
      );
    }

    await transaction.commit();
    return { brand, media };
  } catch (dbError) {
    await transaction.rollback();
    // 3. Rollback Cloudinary if DB fails
    if (uploadResult && uploadResult.public_id) {
      await cloudinary.uploader.destroy(uploadResult.public_id);
    }
    
    if (dbError instanceof ApiError) throw dbError;
    if (dbError.name === "SequelizeUniqueConstraintError") {
      throw new ApiError(409, "Brand name or slug must be unique.");
    }
    throw new ApiError(500, dbError.message || "Failed to create brand.");
  }
};

export const updateBrandService = async (id, data, file) => {
  const transaction = await db.sequelize.transaction();

  const { name, description } = data;

  const existingBrand = await db.Brand.findByPk(id, {
    include: ["media"],
    transaction,
  });

  if (!existingBrand) {
    throw new ApiError(404, "Brand not found.");
  }

  const brand = await db.Brand.findOne({
    where: { name: existingBrand.name },
    transaction,
  });

  if (brand && brand.id !== id) {
    throw new ApiError(409, "Brand with this name already exists.");
  }

  try {
    if (name) {
      brand.name = name;
    }

    if (description) {
      brand.description = description;
    }

    if (file) {
      if (brand.media) {
        await cloudinary.uploader.destroy(brand.media.publicId);
        await brand.media.destroy({ transaction });
      }
    }

    const uploadResult = await uploadToCloudinary(
      file.path,
      process.env.CLOUDINARY_BRAND_FOLDER,
    );

    const media = await db.Media.create(
      {
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        fileType: uploadResult.resource_type,
        tag: "thumbnail",
        associatedType: "brand",
        associatedId: brand.id,
      },
      { transaction },
    );

    await brand.save({ transaction });
    await transaction.commit();

    return { brand, media };
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
  const transaction = await db.sequelize.transaction();

  const brand = await db.Brand.findByPk(id, {
    include: ["media"],
    transaction,
  });

  if (!brand) {
    throw new ApiError(404, "Brand not found.");
  }

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
