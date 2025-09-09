import { Op } from "sequelize";
import db from "../models/index.js";

const User = db.User;
const Review = db.Review;
const Order = db.Order;

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
  const TIME_INTERVAL = 24 * 60 * 60 * 1000;
  console.log("Cleanup service started. Will run every 24 hours.");
  purgeExpiredUsers();
  setInterval(purgeExpiredUsers, TIME_INTERVAL);
};
