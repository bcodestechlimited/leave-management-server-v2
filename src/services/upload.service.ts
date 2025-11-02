import type { UploadApiResponse } from "cloudinary";
import cloudinary from "../lib/cloudinary";
class UploadService {
  async uploadToCloudinary(
    tempFilePath: string
  ): Promise<Partial<UploadApiResponse>> {
    let num = 0;
    let error: any;
    do {
      try {
        const { secure_url, public_id } = await cloudinary.uploader.upload(
          tempFilePath,
          {
            use_filename: true,
            folder: "Haven-Lease",
            resource_type: "auto",
          }
        );
        return { secure_url, public_id };
      } catch (err) {
        console.log(`Error uploading to cloudinary`, { err });
        console.log(`Retry attempt ${num + 1}`);

        num++;
        error = err;
      }
    } while (num < 3);
    throw error;
  }
}

export const uploadService = new UploadService();
