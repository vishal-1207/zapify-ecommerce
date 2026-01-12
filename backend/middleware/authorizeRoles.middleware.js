import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const authorizeRoles = (...allowedRoles) => {
  return asyncHandler(async (req, res, next) => {
    let userRoles = req.user?.roles;

    if (typeof userRoles === "string") {
      userRoles = [userRoles];
    }

    if (!userRoles || !Array.isArray(userRoles)) {
      throw new ApiError(403, "Access denied: Missing roles.");
    }

    const hasPermission = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasPermission) {
      throw new ApiError(
        403,
        `Access denied. Requires one of: ${allowedRoles.join(", ")}`
      );
    }

    next();
  });
};

export default authorizeRoles;
