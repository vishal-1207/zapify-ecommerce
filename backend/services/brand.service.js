import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import uploadToCloudinary from "../utils/cloudinary.util.js";

const Brand = db.Brand;
const Media = db.Media;

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
