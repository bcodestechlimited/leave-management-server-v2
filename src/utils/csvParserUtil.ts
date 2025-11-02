import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import { fileURLToPath } from "url";
import { ApiError } from "./responseHandler";
import Level from "@/modules/level/level.model";
// import ApiError from "./apiError.js";
// import Level from "../v1/models/level.model.js";

// Helper function to parse CSV file and extract data
export const parseCSVFile = (filePath: any) => {
  const results: any = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (data: any) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err: any) => reject(err));
  });
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Function to extract and validate necessary data from the parsed CSV
export const extractAndValidateData = async (
  parsedData: any,
  clientId: string
) => {
  const invitations = await Promise.all(
    parsedData.map(async (row: any, index: any) => {
      const { name, email, level, jobRole } = row;

      if (!name || !email || !level || !jobRole) {
        throw ApiError.badRequest(
          `Each row must contain 'name', 'email', 'level', and 'jobRole' fields - row ${
            index + 1
          }`
        );
      }

      if (!emailRegex.test(email)) {
        throw ApiError.badRequest(
          `Invalid email format in row ${index + 1}: ${email}`
        );
      }

      const levelExist = await Level.findOne({
        name: level.toLowerCase(),
        clientId,
      });

      if (!levelExist) {
        throw ApiError.badRequest(
          `The level '${level}' in row ${index + 1} does not exist`
        );
      }

      return { name, email, levelId: levelExist._id, jobRole };
    })
  );

  return invitations;
};

export const saveFileToUploads = (file: any) => {
  try {
    // Resolve the directory and file path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const tempFilePath = path.join(__dirname, "..", "..", "uploads", file.name);

    // Ensure the directory exists
    if (!fs.existsSync(path.dirname(tempFilePath))) {
      fs.mkdirSync(path.dirname(tempFilePath), { recursive: true });
    }

    // Move the file to the target directory
    file.mv(tempFilePath, (err: any) => {
      if (err) {
        console.error("Error moving file:", err.message);
        throw new Error("Failed to save file. Please try again.");
      } else {
        console.log("File saved successfully at", tempFilePath);
      }
    });

    return tempFilePath; // Return the saved file path
  } catch (error: any) {
    console.error("Error in saveFileToUploads:", error.message);
    throw error;
  }
};
