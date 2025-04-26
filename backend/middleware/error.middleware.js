export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (err.isJoi) {
    statusCode = 400;
    message = "Validation failed.";
    return res.status(statusCode).json({
      message,
      errors: err.details.map((e) => e.message),
    });
  }

  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
