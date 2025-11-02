import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.config";

// console.log({
//   cloud_name: env.CLOUDINARY_NAME, // Fixed spelling
//   api_key: env.CLOUDINARY_API_KEY, // Fixed spelling
//   api_secret: !!env.CLOUDINARY_API_SECRET, // Don't log actual secret, just check if exists
// });

cloudinary.config({
  cloud_name: env.CLOUDINARY_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;
