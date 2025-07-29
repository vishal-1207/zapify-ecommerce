export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRoles = Array.isArray(req.user?.roles)
      ? req.user.roles
      : [req.user?.roles];
    const hasPermission = allowedRoles.some((role) => userRoles.includes(role));
    if (!hasPermission) {
      return res.status(403).json({
        message:
          "Access denied. You do not have permission to perform this action.",
      });
    }
    next();
  };
};
