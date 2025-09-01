import cron from "node-cron";
import { Op } from "sequelize";
import db from "../models/index.js";

const User = db.User;
const Review = db.Review;
const Order = db.Order;

const scheduleUserPurge = () => {
  cron.schedule("0 2 * * * *", async () => {
    console.log(
      "✅ Running scheduled job: Purging soft-deleted user accounts..."
    );

    const transaction = await db.sequelize.transaction();

    try {
      const usersToPurge = await User.findAll({
        where: {
          deletedAt: { [Op.ne]: null },
          scheduleForDeletionAt: { [Op.lte]: new Date() },
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
        await db.Review.update(
          { userId: null },
          { where: { userId: user.id }, transaction }
        );

        await db.Order.update(
          { userId: null },
          { where: { userId: user.id }, transaction }
        );

        await user.destroy({ force: true, transaction });

        await transaction.commit();
        console.log(
          `✅ Successfully purged ${usersToPurge.length} user account(s).`
        );
      }
    } catch (error) {
      await transaction.rollback();
      console.error(
        "❌ Error during scheduled user purge, transaction rolled back:",
        error
      );
    }
  });
};
