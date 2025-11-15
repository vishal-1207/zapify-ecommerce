/**
 * A generic pagination helper for Sequelize models.
 * @param {Sequelize.Model} model - The Sequelize model to paginate.
 * @param {object} queryOptions - The options for findAndCountAll (where, include, order, etc.).
 * @param {number} page - The current page number (1-based).
 * @param {number} limit - The number of items per page.
 * @returns {Promise<object>} An object containing paginated data and metadata.
 */
export default paginate = async (
  model,
  queryOptions = {},
  page = 1,
  limit = 10
) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, parseInt(limit, 10) || 10);

  const offset = (safePage - 1) * safeLimit;

  const { count, rows } = await model.findAndCountAll({
    ...queryOptions,
    offset,
    limit: safeLimit,
  });

  const totalPages = Math.ceil(count / safeLimit);

  return {
    data: rows,
    total: count,
    page: safePage,
    limit: safeLimit,
    totalPages: totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
};
