import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { Request } from "express";
import dotenv from "dotenv";

dotenv.config();

const bucketName = process.env.AWS_BUCKET_NAME;
if (!bucketName) {
  throw new Error(
    "AWS_S3_BUCKET_NAME is not defined in environment variables."
  );
}

const s3 = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

const upload = multer({
  storage: multerS3({
    s3,
    bucket: bucketName,
    metadata: (req, file, cb) => {
      console.log("Metadata Middleware Triggered");
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      console.log("File Key Middleware Triggered:", file.originalname);
      cb(null, `profile-pictures/${Date.now()}-${file.originalname}`);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      console.log("File Accepted:", file.mimetype);
      cb(null, true);
    } else {
      console.log("Invalid File Type:", file.mimetype);
      cb(new Error("Only image files are allowed!"));
    }
  },
});

export default upload;
