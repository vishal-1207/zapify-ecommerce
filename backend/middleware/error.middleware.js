const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.isJoi) {
    statusCode = 400;
    message = "Validation failed.";
    return res.status(statusCode).json({
      message,
      errors: err.details.map((e) => e.message),
    });
  }

  return res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export default errorHandler;
