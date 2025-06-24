export const authrorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role || [];
    const hasPermission = roles.some((role) => userRole.includes(role));
    if (!hasPermission) {
      return res.status(403).json({
        message:
          "Access denied. You do not have permission to perform this action.",
      });
    }
    next();
  };
};
