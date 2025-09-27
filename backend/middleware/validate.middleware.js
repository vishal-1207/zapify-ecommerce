import fs from "fs";
import path from "path";

const deleteUploadedFiles = (req) => {
  const files = req.files;

  if (!files) return;

  const allFiles = Array.isArray(files) ? files : Object.values(files).flat();

  for (const file of allFiles) {
    const filePath = path.resolve(file.path);
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.warn(`Failed to delete file ${filePath}:`, err.message);
    }
  }
};

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
      deleteUploadedFiles(req);

      const errorDetails = error.details.map((detail) => ({
        message: detail.message,
        path: detail.path,
      }));

      return res.status(400).json({
        message: "Validation error",
        errors: errorDetails,
      });
    }
  };
};
