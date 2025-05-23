export const validate = (schema, source = "body") => {
  return async (req, res, next) => {
    try {
      const value = await schema.validateAsync(req[source], {
        abortEarly: false,
        stripUnknown: true,
      });

      req[source] = value;
      next();
    } catch (error) {
      const errorDetails = error.details.map((detail) => ({
        message: detail.message,
        path: detail.path,
      }));

      res.status(400).json({
        message: "Validation error",
        errors: errorDetails,
      });
    }
  };
};
