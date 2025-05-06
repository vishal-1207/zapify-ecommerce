import cloudinary from "../config/cloudinary.js";
import sequelize from "../config/db.js";
import db from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import uploadToCloudinary from "../utils/cloudinary.util.js";

const Product = db.Product;
const Media = db.Media;
const ProductSpec = db.ProductSpec;

export const createProductService = async (data, files) => {
  const { name, description, price, stock, specs = [] } = data;

  const transaction = await sequelize.transaction();

  try {
    const createdProduct = await Product.create(
      { name, description, price, stock, categoryId },
      { transaction }
    );

    let thumbnail = null;
    const thumbnailFile = files?.thumbnail?.[0];
    if (thumbnailFile) {
      const thumbnailUpload = await uploadToCloudinary(
        thumbnailFile.path,
        process.env.CLOUDINARY_PRODUCT_FOLDER
      );

      thumbnail = await Media.create(
        {
          publicId: thumbnailUpload.public_id,
          url: thumbnailUpload.secure_url,
          fileType: thumbnailUpload.secure_url,
          tag: "thumbnail",
          associatedType: "product",
          associatedId: createdProduct.id,
        },
        { transaction }
      );
    }

    let gallery = [];
    const galleryFiles = files?.gallery || [];

    if (galleryFiles.length > 0) {
      const uploadGalleryFiles = galleryFiles.map((galleryFile) =>
        uploadToCloudinary(
          galleryFile.path,
          process.env.CLOUDINARY_PRODUCT_FOLDER
        )
      );

      const uploadResults = await Promise.all(uploadGalleryFiles);
      gallery = await Promise.all(
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
    return { createdProduct, productSpecs, thumbnail, gallery };
  } catch (error) {
    await transaction.rollback();
    throw new ApiError(500, "Failed to create product.");
  }
};

export const updateProductService = async (productId, data) => {
  const {
    categoryId,
    name,
    brand,
    description,
    price,
    stock,
    specs = [],
  } = data;

  const transaction = await sequelize.transaction();

  try {
    const product = await Product.findByPk(productId, {
      include: [
        {
          model: Media,
          as: "media",
        },
        {
          model: ProductSpec,
          as: "specs",
        },
      ],
    });

    if (!product) throw new ApiError(404, "Product not found.");

    if (name) product.name = name;
    if (brand) product.brand = brand;
    if (description) product.description = description;
    if (price) product.price = price;
    if (stock) product.stock = stock;
    if (categoryId) productId.categoryId = categoryId;

    const updatedProduct = await Product.save({ transaction });

    // THUMBNAIL UPDATE LOGIC

    let updatedThumbnail = null;
    if (files?.thumbnail) {
      const existingThumbnail = product.media.find(
        (m) => m.tag === "thumbnail"
      );

      if (existingThumbnail) {
        await cloudinary.uploader.destroy(existingThumbnail.publicId);
        await existingThumbnail.destroy({ transaction });
      }

      const uplaodThumbnail = await uploadToCloudinary(
        files.thumbnail[0].path,
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

    return { updatedProduct, updatedSpecs, updatedThumbnail, updatedGallery };
  } catch (error) {
    await transaction.rollback();
    throw new ApiError(500, "Failed to update product.");
  }
};
