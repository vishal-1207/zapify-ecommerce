import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import uploadToCloudinary from "../utils/cloudinary.util.js";
import cloudinary from "../config/cloudinary.js";

export const addBrandService = async (data, file) => {
  const transaction = await db.sequelize.transaction();

  const { name, description } = data;
  const existingBrand = await db.Brand.findOne({
    where: { name },
  });

  if (existingBrand) throw new ApiError(409, "Brand already exists.");

  try {
    const brand = await db.Brand.create(
      {
        name,
        description,
      },
      { transaction },
    );

    let media;
    if (file) {
      const uploadResult = await uploadToCloudinary(
        file.path,
        process.env.CLOUDINARY_BRAND_FOLDER,
      );

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
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ApiError) throw error;

    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ApiError(409, "Brand name or slug must be unique.");
    }

    throw new ApiError(500, error.message || "Failed to create brand.");
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
