import db from "../models/index.js";
import uploadToCloudinary from "../utils/cloudinary.util.js";

/**
 * Handles background image upload and Media record creation.
 * This function should NOT be awaited by the main request handler if speed is priority.
 *
 * @param {string} filePath - Path to the local file
 * @param {string} folder - Cloudinary folder
 * @param {string} associatedType - Model name (e.g., "category", "product")
 * @param {string} associatedId - ID of the associated record
 * @param {string} tag - Tag for the media (default: "thumbnail")
 */
export const processBackgroundUpload = async ({
  filePath,
  folder,
  associatedType,
  associatedId,
  tag = "thumbnail",
}) => {
  if (!filePath) {
    return;
  }

  try {
    const upload = await uploadToCloudinary(filePath, folder);

    if (!upload) {
      return;
    }

    if (tag === "thumbnail") {
      const existingMedia = await db.Media.findOne({
        where: { associatedType, associatedId, tag },
      });

      if (existingMedia) {
        if (existingMedia.publicId) {
          const cloudinary = (await import("../config/cloudinary.js")).default;
          cloudinary.uploader.destroy(existingMedia.publicId).catch((err) =>
            console.error("[Worker] Cloudinary old image destroy error:", err),
          );
        }
        await existingMedia.update({
          publicId: upload.public_id,
          url: upload.secure_url,
          fileType: upload.resource_type,
        });
      } else {
        await db.Media.create({
          publicId: upload.public_id,
          url: upload.secure_url,
          fileType: upload.resource_type,
          tag: tag,
          associatedType: associatedType,
          associatedId: associatedId,
        });
      }
    } else {
      await db.Media.create({
        publicId: upload.public_id,
        url: upload.secure_url,
        fileType: upload.resource_type,
        tag: tag,
        associatedType: associatedType,
        associatedId: associatedId,
      });
    }

    if (associatedType === "product" || associatedType === "Product") {
      const { syncProductToAlgolia } = await import("./algolia.service.js");
      await syncProductToAlgolia(associatedId).catch((err) =>
        console.error(
          `[Worker] Failed post-upload Algolia sync: ${err.message}`,
        ),
      );
    }
  } catch (error) {
    console.error(
      `[Worker] Background upload failed for ${associatedType} ${associatedId}:`,
      error,
    );
  }
};
