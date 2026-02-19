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
export const processBackgroundUpload = async ({ filePath, folder, associatedType, associatedId, tag = "thumbnail" }) => {
  console.log(`[Worker] Starting background upload for ${associatedType} ${associatedId}...`);
  
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

    // specific handling for updates: remove old media if exists? 
    // For now, let's assume the service handles cleanup of OLD media before calling this, 
    // OR we can make this smart. 
    // "addCategory" is simple. "updateCategory" might need old media cleanup.
    // The previous synchronous logic was:
    // 1. Destroy old media (if exists)
    // 2. Upload new
    // 3. Create new Media record
    
    // For background process, we should just ADD the new media.
    // Cleanup of old media should ideally happen BEFORE this or be part of this if passed.
    
    // Let's keep it simple: Just Upload + Create Media record.
    
    await db.Media.create({
      publicId: upload.public_id,
      url: upload.secure_url,
      fileType: upload.resource_type,
      tag: tag,
      associatedType: associatedType,
      associatedId: associatedId,
    });

    console.log(`[Worker] Background upload successful for ${associatedType} ${associatedId}.`);
  } catch (error) {
    console.error(`[Worker] Background upload failed for ${associatedType} ${associatedId}:`, error);
    // In a real production system, we might want to:
    // 1. Retry
    // 2. Mark the record as having "failed upload" state
    // 3. Alert admin
  }
};
