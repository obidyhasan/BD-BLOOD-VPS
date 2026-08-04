/* eslint-disable no-useless-escape */
import { CloudinaryStorage } from "multer-storage-cloudinary-v2";
import { cloudinaryUpload } from "./cloudinary.config";
import multer from "multer";

const storage = new CloudinaryStorage({
  // multer-storage-cloudinary-v2 types don't perfectly match cloudinary v2 typings
  // (runtime is compatible). Keep the cast local to this integration boundary.
  cloudinary: cloudinaryUpload as any,
  params: {
    public_id: (req, file) => {
      const fileName = file.originalname
        .toLowerCase()
        .replace(/\s+/g, "-") // empty space remove replace with "-"
        .replace(/\./g, "-")
        .replace(/[^a-z0-9\-\.]/g, "");

      const extension = file.originalname.split(".").pop();

      const uniqueFileName =
        Math.random().toString(36).substring(2) +
        "-" +
        Date.now() +
        "-" +
        fileName +
        "." +
        extension;

      return uniqueFileName;
    },
  },
});

// Both call sites (post media, user avatar) only ever send images from the
// frontend's own upload widgets. Cap size and restrict MIME type so an
// arbitrary/huge file can't reach Cloudinary via a direct API call that
// bypasses the frontend's own picker.
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const multerUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WEBP, or GIF images are allowed."));
    }
  },
});
