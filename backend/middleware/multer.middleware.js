import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname),
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (![".jpeg", ".png", ".jpg", ".mp4", ".mov"].includes(ext)) {
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
