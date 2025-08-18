import { v2 as cloudinary } from "cloudinary";
import { config } from "./config";
cloudinary.config({
  cloud_name: config.Cloudinary_Cloud_Name,
  api_key: config.Cloudinary_api_key,
  api_secret: config.Cloudinary_api_secret,
});

export default cloudinary;
