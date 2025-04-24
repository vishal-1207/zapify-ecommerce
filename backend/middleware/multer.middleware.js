import multer from "multer";
import sanitize from "sanitize-filename";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads/"),
  filename: (req, file, cb) => {
    const sanitizedFilename = sanitize(file.originalname);
    cb(null, `${Date.now()}_${sanitizedFilename}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "video/mp4",
    "video/quicktime",
  ];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Unsupported file type."), false);
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});
