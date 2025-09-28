/**
 * Generic pagination utility for Sequelize models.
 *
 * @param {Model} model - Sequelize model
 * @param {Object} options - query options (where, include, order, etc.)
 * @param {number} page - current page (default: 1)
 * @param {number} limit - records per page (default: 15)
 * @returns {Object} - { total, totalPages, currentPage, rows }
 */
export const paginate = async (model, options = {}, page = 1, limit = 15) => {
  const offset = (page - 1) * limit;

  const { count, rows } = await model.findAndCountAll({
    ...options,
    limit,
    offset,
  });

  return {
    total: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    rows,
  };
};
