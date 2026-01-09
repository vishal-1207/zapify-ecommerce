import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import uploadToCloudinary from "../utils/cloudinary.util.js";

export const addBrandService = async (data, file) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { name, description } = data;
    const logo = file.path;

    const existingBrand = await db.Brand.findOne(
      {
        where: { name },
      },
      transaction
    );

    if (existingBrand) throw new ApiError(409, "Brand already exists.");

    const uploadResult = await uploadToCloudinary(
      logo,
      process.env.CLOUDINARY_BRAND_FOLDER
    );

    const brand = await db.Brand.create(
      {
        name,
        description,
      },
      { transaction }
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
      { transaction }
    );

    return { brand, media };
  } catch (error) {
    await transaction.rollback();
    throw new ApiError(500, "Failed to create brand.", error);
  }
};

export const updateBrandService = async (id, data, file) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { name, description } = data;

    const existingBrand = await db.Brand.findByPk(id, {
      include: ["media"],
      transaction,
    });
    if (!existingBrand) {
      throw new ApiError(404, "Brand not found.");
    }

    if (name) {
      const brand = await db.Brand.findOne({
        where: { name },
        transaction,
      });

      if (brand && brand.id !== id) {
        throw new ApiError(409, "Brand with this name already exists.");
      }

      brand.name = name;
      brand.description = description || brand.description;
      await brand.save();

      if (file) {
        if (brand.media) {
          if (brand.media.publicId) {
            await cloudinary.uploader.destroy(brand.media.publicId, {
              resource_type: "image",
            });
          }
          await brand.media.destroy();
        }
      }

      const uploadResult = await uploadToCloudinary(
        image.path,
        process.env.CLOUDINARY_BRAND_FOLDER
      );

      const media = await db.Media.create({
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        fileType: uploadResult.resource_type,
        tag: "thumbnail",
        associatedType: "brand",
        associatedId: category.id,
      });

      return { brand, media };
    }
  } catch (error) {
    await transaction.rollback();
    throw new ApiError(500, "Failed to update brand.", error);
  }
};

export const deleteBrandService = async (id) => {
  const transaction = await db.sequelize.transaction();

  try {
    const brand = await db.Brand.findByPk(id, {
      include: ["media"],
      transaction,
    });

    if (!brand) {
      throw new ApiError(404, "Brand not found.");
    }

    if (brand.media) {
      if (brand.media.publicId) {
        await cloudinary.uploader.destroy(brand.media.publicId, {
          resource_type: media.fileType || "image",
        });
      }
    }

    await brand.destroy({ transaction });
  } catch (error) {
    await transaction.rollback();
    throw new ApiError(500, "Failed to delete brand.", error);
  }
};
