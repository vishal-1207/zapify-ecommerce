import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import uploadToCloudinary from "../utils/cloudinary.util.js";

const Brand = db.Brand;
const Media = db.Media;

// GET BRAND SERVICE
export const getBrandService = async (id) => {
  try {
    const brand = await Brand.findByPk(id);
    if (!brand) throw new ApiError(404, "Brand not found");
    return brand;
  } catch (error) {
    throw new ApiError(500, "Error fetching brand");
  }
};

export const addBrandService = async (data, file) => {
  const { name, description } = data;
  const logo = file.path;

  const existingBrand = await Brand.findOne({
    where: { name },
  });

  if (existingBrand) throw new ApiError(409, "Brand already exists.");

  const uploadResult = await uploadToCloudinary(
    logo,
    process.env.CLOUDINARY_BRAND_FOLDER
  );

  const brand = await Brand.create({
    name,
    description,
  });

  const media = await Media.create({
    publicId: uploadResult.public_id,
    url: uploadResult.secure_url,
    fileType: uploadResult.resource_type,
    tag: "thumbnail",
    associatedType: "brand",
    associatedId: brand.id,
  });

  return { brand, media };
};

export const updateBrandService = async (id, data, file) => {
  const { name, description } = data;

  const existingBrand = await Brand.findByPk(id);
  if (!existingBrand) {
    throw new ApiError(404, "Brand not found.");
  }

  if (name) {
    const brand = await Brand.findOne({
      where: { name },
    });

    if (brand && brand.id !== id) {
      throw new ApiError(409, "Brand with this name already exists.");
    }

    brand.name = name;
    brand.description = description || brand.description;
    await brand.save();

    if (file) {
      const existingMedia = await Media.findOne({
        where: {
          associatedType: "brand",
          associatedId: id,
        },
      });

      if (existingMedia) {
        if (existingMedia.publicId) {
          await cloudinary.uploader.destroy(existingMedia.publicId, {
            resource_type: "image",
          });
        }
        await existingMedia.destroy();
      }
    }

    const uploadResult = await uploadToCloudinary(
      image.path,
      process.env.CLOUDINARY_BRAND_FOLDER
    );

    const media = await Media.create({
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url,
      fileType: uploadResult.resource_type,
      tag: "thumbnail",
      associatedType: "brand",
      associatedId: category.id,
    });

    return { brand, media };
  }
};

export const deleteBrandService = async (id) => {
  const brand = await Brand.findByPk(id);

  if (!brand) {
    throw new ApiError(404, "Brand not found.");
  }

  const media = await Media.findOne({
    where: {
      associatedType: "brand",
      associatedId: id,
    },
  });

  if (media) {
    if (media.publicId) {
      await cloudinary.uploader.destroy(media.publicId, {
        resource_type: media.fileType || "image",
      });
    }
  }

  await media?.destroy();
  await brand.destroy();
};
