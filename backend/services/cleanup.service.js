import { Op } from "sequelize";
import db from "../models/index.js";

import cloudinary from "../config/cloudinary.js";

const User = db.User;
const Category = db.Category;
const Review = db.Review;
const Order = db.Order;

export const purgeDeletedCategories = async () => {
  console.log("Running scheduled job: Purging soft-deleted categories...");
  const transaction = await db.sequelize.transaction();

  try {
    const categoriesToPurge = await Category.findAll({
      where: {
        deletedAt: { [Op.ne]: null },
      },
      paranoid: false,
      include: [{ model: db.Media, as: "media" }],
      transaction,
    });

    if (categoriesToPurge.length === 0) {
      await transaction.commit();
      return;
    }

    const { reSyncProductsByCriteria } = await import("./algolia.service.js");

    for (const category of categoriesToPurge) {
      // 1. Delete image from Cloudinary
      if (category.media) {
        try {
          await cloudinary.uploader.destroy(category.media.publicId);
          await category.media.destroy({ transaction });
        } catch (mediaError) {
          console.error(`Failed to delete media for category ${category.id}:`, mediaError);
        }
      }

      // 2. Sync Algolia (products become uncategorized)
      try {
        await reSyncProductsByCriteria({ categoryId: category.id });
      } catch (algoliaError) {
        console.error(`Failed to sync Algolia for category ${category.id}:`, algoliaError);
      }

      // 3. Hard Delete Category
      await category.destroy({ force: true, transaction });
    }

    await transaction.commit();
    console.log(`Successfully purged ${categoriesToPurge.length} category(s).`);
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error during category purge:", error);
  }
};

const purgeExpiredUsers = async () => {
  console.log("Running scheduled job: Purging soft-deleted user accounts...");
  const transaction = await db.sequelize.transaction();

  try {
    const usersToPurge = await User.findAll({
      where: {
        deletedAt: { [Op.ne]: null },
        scheduledForDeletionAt: { [Op.lte]: new Date() },
      },
      paranoid: false,
      transaction,
    });

    if (usersToPurge.length === 0) {
      console.log("No user accounts to purge today.");
      await transaction.commit();
      return;
    }

    for (const user of usersToPurge) {
      await Review.update(
        { user: null },
        { where: { userId: user.Id }, transaction }
      );

      await Order.update(
        { user: null },
        { where: { userId: user.id }, transaction }
      );

      await User.destroy({ force: true, transaction });
    }

    await transaction.commit();
    console.log(`Successfully purged ${usersToPurge.length} user account(s).`);
  } catch (error) {
    await transaction.rollback();
    console.error(
      "Error during scheduled user purge, transaction rolled back: ",
      error
    );
  }
};

export const startCleanupService = () => {
  const USER_PURGE_INTERVAL = 24 * 60 * 60 * 1000; // 24 Hours
  const CATEGORY_PURGE_INTERVAL = 5 * 60 * 60 * 1000; // 5 Hours

  console.log("Cleanup service started.");
  
  // User Purge
  purgeExpiredUsers();
  setInterval(purgeExpiredUsers, USER_PURGE_INTERVAL);

  // Category Purge
  purgeDeletedCategories();
  setInterval(purgeDeletedCategories, CATEGORY_PURGE_INTERVAL);
};
