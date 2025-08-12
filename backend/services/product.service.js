import cloudinary from "../config/cloudinary.js";
import sequelize from "../config/db.js";
import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import uploadToCloudinary from "../utils/cloudinary.util.js";
import { Op } from "sequelize";

const Product = db.Product;
const Media = db.Media;
const ProductSpec = db.ProductSpec;
const Category = db.Category;
const Brand = db.Brand;
const Seller = db.SellerProfile;

// FETCH PRODUCT DETAILS SERVICE
export const getProductDetailsService = async (identifier) => {
  const whereCondition = identifier.id
    ? { id: identifier.id }
    : { slug: identifier.slug };

  const product = await Product.findOne({
    where: whereCondition,
    include: [
      { model: Category, as: "category" },
      { model: Brand, as: "brand" },
      { model: Media, as: "media" },
      { model: Seller, as: "seller" },
      {
        model: Review,
        as: "reviews",
        attributes: ["id", "rating", "comment", "createdAt"],
        separate: true,
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: User,
            as: "reviewer",
            attributes: ["id", "fullname"],
          },
        ],
      },
    ],
  });
};

// CREATE PRODUCT SERVICE
export const createProductService = async (data, files) => {
  const {
    categoryId,
    brandId,
    name,
    description,
    price,
    stock,
    specs = [],
  } = data;

  const transaction = await sequelize.transaction();
  let committed = false;

  try {
    const createdProduct = await Product.create(
      { name, description, price, stock, categoryId, brandId },
      { transaction }
    );

    let thumbnailImage = null;
    const thumbnail = files.thumbnail;

    if (thumbnail) {
      const thumbnailUpload = await uploadToCloudinary(
        thumbnail.path,
        process.env.CLOUDINARY_PRODUCT_FOLDER
      );

      thumbnailImage = await Media.create(
        {
          publicId: thumbnailUpload.public_id,
          url: thumbnailUpload.secure_url,
          fileType: thumbnailUpload.resource_type,
          tag: "thumbnail",
          associatedType: "product",
          associatedId: createdProduct.id,
        },
        { transaction }
      );
    }

    let galleryImages = [];
    const galleryFiles = files?.gallery || [];

    if (galleryFiles.length > 0) {
      const uploadGalleryFiles = galleryFiles.map((galleryFile) =>
        uploadToCloudinary(
          galleryFile.path,
          process.env.CLOUDINARY_PRODUCT_FOLDER
        )
      );

      const uploadResults = await Promise.all(uploadGalleryFiles);
      galleryImages = await Promise.all(
        uploadResults.map((uploadResult) =>
          Media.create(
            {
              publicId: uploadResult.public_id,
              url: uploadResult.secure_url,
              fileType: uploadResult.resource_type,
              tag: "gallery",
              associatedType: "product",
              associatedId: createdProduct.id,
            },
            { transaction }
          )
        )
      );
    }

    const specEntries = specs.map(({ key, value }) => ({
      key,
      value,
      productId: createdProduct.id,
    }));

    const productSpecs = await ProductSpec.bulkCreate(specEntries, {
      transaction,
    });
    await transaction.commit();
    committed = true;
    return { createdProduct, productSpecs, thumbnailImage, galleryImages };
  } catch (error) {
    if (!committed) await transaction.rollback();

    console.error(error);
    throw new ApiError(500, "Failed to create product.");
  }
};

// UPDATE PRODUCT SERVICE
export const updateProductService = async (productId, data, files) => {
  const {
    categoryId,
    brandId,
    name,
    description,
    price,
    stock,
    specs = [],
  } = data;

  const transaction = await sequelize.transaction();
  let committed = false;

  try {
    const product = await Product.findByPk(productId, {
      include: [
        {
          model: Media,
          as: "media",
        },
        {
          model: ProductSpec,
        },
      ],
    });

    if (!product) throw new ApiError(404, "Product not found.");

    if (name) product.name = name;
    if (brandId) product.brandId = brandId;
    if (description) product.description = description;
    if (price) product.price = price;
    if (stock) product.stock = stock;
    if (categoryId) product.categoryId = categoryId;

    const updatedProduct = await product.save({ transaction });

    // THUMBNAIL UPDATE LOGIC
    let updatedThumbnail = null;
    if (files.thumbnail) {
      const existingThumbnail = product.media.find(
        (m) => m.tag === "thumbnail"
      );

      if (existingThumbnail) {
        await cloudinary.uploader.destroy(existingThumbnail.publicId);
        await existingThumbnail.destroy({ transaction });
      }

      const uplaodThumbnail = await uploadToCloudinary(
        files.thumbnail.path,
        process.env.CLOUDINARY_PRODUCT_FOLDER
      );

      updatedThumbnail = await Media.create(
        {
          publicId: uplaodThumbnail.public_id,
          url: uplaodThumbnail.secure_url,
          fileType: uplaodThumbnail.resource_type,
          tag: "thumbnail",
          associatedType: "product",
          associatedId: product.id,
        },
        { transaction }
      );
    }

    // GALLERY MEDIA UPDATE LOGIC
    let updatedGallery = null;
    if (files?.gallery && files.gallery.length > 0) {
      const existingGallery = product.media.filter((m) => m.tag === "gallery");

      for (const media of existingGallery) {
        await cloudinary.uploader.destroy(media.publicId);
        await media.destroy({ transaction });
      }

      const uploadPromises = files.gallery.map((file) =>
        uploadToCloudinary(file.path, process.env.CLOUDINARY_PRODUCT_FOLDER)
      );

      const uploadGallery = await Promise.all(uploadPromises);

      const galleryMedia = uploadGallery.map((upload) => ({
        publicId: upload.public_id,
        url: upload.secure_url,
        fileType: upload.resource_type,
        tag: "gallery",
        associatedType: "product",
        associatedId: product.id,
      }));

      updatedGallery = await Media.bulkCreate(galleryMedia, { transaction });
    }

    // SPECS UPDATE LOGIC
    let updatedSpecs = null;
    if (specs.length > 0) {
      await ProductSpec.destroy({
        where: { productId: product.id },
        transaction,
      });

      const newSpecs = specs.map((spec) => ({
        key: spec.key,
        value: spec.value,
        productId: product.id,
      }));

      updatedSpecs = await ProductSpec.bulkCreate(newSpecs, { transaction });
    }

    await transaction.commit();
    committed = true;

    return { updatedProduct, updatedSpecs, updatedThumbnail, updatedGallery };
  } catch (error) {
    console.error(error);
    if (!committed) await transaction.rollback();
    throw new ApiError(500, "Failed to update product.");
  }
};

// DELETE PRODUCT SERVICE
export const deleteProductService = async (productId) => {
  const transaction = await sequelize.transaction();

  try {
    const product = await Product.findByPk(productId, {
      include: [{ model: Media, as: "media" }, { model: ProductSpec }],
      transaction,
    });

    if (!product) {
      throw new ApiError(400, "Product not found.");
    }

    if (product.media && product.media.length > 0) {
      for (const media of product.media) {
        if (media.publicId) {
          await cloudinary.uploader.destroy(media.publicId, {
            resource_type: media.fileType,
          });
        }

        await media.destroy({ transaction });
      }
    }

    if (product.ProductSpec && product.ProductSpec.length > 0) {
      for (const spec of product.ProductSpec) {
        await spec.destroy({ transaction });
      }
    }

    await product.destroy({ transaction });
    await transaction.commit();
    return { message: "Product deleted successfully." };
  } catch (error) {
    console.error(error);
    await transaction.rollback();
    throw new ApiError(500, "Something went wrong.");
  }
};
