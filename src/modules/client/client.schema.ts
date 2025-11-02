import type { NextFunction, Request, Response } from "express";
import * as z from "zod";
import { ApiError } from "../../utils/responseHandler";
import type { UploadedFile } from "express-fileupload";

class ClientSchemas {
  login = z
    .object({
      email: z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address"),

      password: z
        .string({ required_error: "Password is required" })
        .min(3, "Password must be at least 3 characters long"),
    })
    .strict();

  update = z
    .object({
      name: z
        .string({ required_error: "Name is required" })
        .email("Please provide a valid email address"),

      color: z.string({ required_error: "Color is required" }),
    })
    .strict();

  forgotPassword = z
    .object({
      password: z
        .string({ required_error: "Password is required" })
        .min(3, "Password must be at least 3 characters long"),
    })
    .strict();

  resetPassword = z
    .object({
      token: z
        .string({ required_error: "Token is required" })
        .email("Please provide a token"),

      password: z
        .string({ required_error: "Password is required" })
        .min(3, "Password must be at least 3 characters long"),
    })
    .strict();

  validateUpdateLogo = (req: Request, res: Response, next: NextFunction) => {
    const logo = req.files?.logo as UploadedFile | undefined;

    console.log({ logo });

    if (!logo) {
      return next();
    }

    // Optional: Validate each file is an image or a document
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

    // Validate file type
    if (!allowedMimeTypes.includes(logo.mimetype)) {
      throw ApiError.badRequest(
        `Invalid file type. Allowed types are: ${allowedMimeTypes.join(", ")}`
      );
    }

    // Validate file size (10MB max)
    const maxSize = 5 * 1024 * 1024; // 10 MB
    if (logo.size > maxSize) {
      throw ApiError.badRequest(
        `File size exceeds the maximum allowed limit of ${
          maxSize / 1024 / 1024
        } MB.`
      );
    }

    next();
  };
  validateAddLogo = (req: Request, res: Response, next: NextFunction) => {
    const logo = req.files?.logo as UploadedFile | undefined;

    console.log({ logo });

    if (!logo) {
      throw ApiError.badRequest("Logo file is required.");
    }

    // Optional: Validate each file is an image or a document
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

    // Validate file type
    if (!allowedMimeTypes.includes(logo.mimetype)) {
      throw ApiError.badRequest(
        `Invalid file type. Allowed types are: ${allowedMimeTypes.join(", ")}`
      );
    }

    // Validate file size (10MB max)
    const maxSize = 5 * 1024 * 1024; // 10 MB
    if (logo.size > maxSize) {
      throw ApiError.badRequest(
        `File size exceeds the maximum allowed limit of ${
          maxSize / 1024 / 1024
        } MB.`
      );
    }

    next();
  };
}

export const clientSchemas = new ClientSchemas();
