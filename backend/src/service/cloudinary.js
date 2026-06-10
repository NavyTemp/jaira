import { v2 as cloudinary } from "cloudinary"
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({path:path.resolve("src/config/.env")});
cloudinary.config({
api_key:process.env.CLOUDINARY_API_KEY,
api_secret:process.env.CLOUDINARY_API_SECRET,
cloud_name:process.env.CLOUDINARY_CLOUD_NAME
})

export default cloudinary