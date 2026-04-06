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
  console.log(
    `[Worker] Starting background upload for ${associatedType} ${associatedId}...`,
  );

  if (!filePath) {
    console.warn("[Worker] No file path provided for background upload.");
    return;
  }

  try {
    const upload = await uploadToCloudinary(filePath, folder);

    if (!upload) {
      console.error("[Worker] Upload failed or returned null.");
      return;
    }

    await db.Media.create({
      publicId: upload.public_id,
      url: upload.secure_url,
      fileType: upload.resource_type,
      tag: tag,
      associatedType: associatedType,
      associatedId: associatedId,
    });

    console.log(
      `[Worker] Background upload successful for ${associatedType} ${associatedId}.`,
    );

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
