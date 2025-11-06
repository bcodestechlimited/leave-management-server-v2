import type { NextFunction, Request, Response } from "express";
import * as z from "zod";
import { ApiError } from "../../utils/responseHandler";
import type { UploadedFile } from "express-fileupload";

class EmployeeSchemas {
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

  inviteValidation = z
    .object({
      email: z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address"),

      expiresIn: z
        .number({ required_error: "Expires in is required" })
        .int("Expires in must be a number")
        .min(1, "Expires in must be at least 1"),
    })
    .strict();

  addEmployeeValidation = z
    .object({
      email: z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address"),
      firstname: z
        .string({ required_error: "Firstname is required" })
        .email("Please provide a firstname"),
      middlename: z
        .string({ required_error: "Middlename is required" })
        .email("Please provide a middlename"),
      surname: z
        .string({ required_error: "Lastname is required" })
        .email("Please provide a surname"),
      accountType: z.enum(["employee", "lineManager"], {
        errorMap: (error, ctx) => {
          return {
            message: "Account type must be either 'employee' or 'lineManager'",
            ...error,
          };
        },
      }),
    })
    .strict();

  forgotPasswordValidation = z
    .object({
      email: z
        .string({ required_error: "Email is required" })
        .email("Please provide a valid email address"),
    })
    .strict();

  resetPassword = z
    .object({
      token: z.string({ required_error: "Token is required" }),
      password: z
        .string({ required_error: "Password is required" })
        .min(3, "Password must be at least 3 characters long"),
    })
    .strict();

  updateEmployeeAdminStatus = z
    .object({
      isAdmin: z.boolean({
        required_error: "isAdmin is required",
        invalid_type_error: "isAdmin must be a boolean value (true or false)",
      }),
    })
    .strict();

  updateEmployeeByAdmin = z
    .object({
      _id: z.string().optional().describe("ID must be a string."),
      staffId: z.string().optional().describe("Staff ID must be a string."),
      firstname: z.string().optional().describe("Name must be a string."),
      middlename: z.string().optional().describe("Name must be a string."),
      surname: z.string().optional().describe("Name must be a string."),
      email: z.string().email("Please provide a valid email address"),
      jobRole: z.string().optional().describe("Job role must be a string."),
      branch: z.string().optional().describe("Branch must be a string."),
      gender: z
        .enum(["male", "female"])
        .optional()
        .describe("Gender must be one of: male, female"),
      lineManager: z
        .string()
        .nullable()
        .optional()
        .refine(
          (val) =>
            val === null || val === undefined || /^[0-9a-fA-F]{24}$/.test(val),
          {
            message: "Line Manager must be a valid MongoDB ID.",
          }
        ),
      reliever: z
        .string()
        .nullable()
        .optional()
        .refine(
          (val) =>
            val === null || val === undefined || /^[0-9a-fA-F]{24}$/.test(val),
          {
            message: "Reliever must be a valid MongoDB ID.",
          }
        ),
      levelId: z
        .string()
        .optional()
        .refine((val) => val === undefined || /^[0-9a-fA-F]{24}$/.test(val), {
          message: "Level ID must be a valid MongoDB ID.",
        }),
      isAdmin: z
        .boolean()
        .optional()
        .describe("isAdmin must be a boolean value (true or false)"),
    })
    .strict();

  employeeProfileUpdate = z
    .object({
      firstname: z.string().optional().describe("Name must be a string."),
      middlename: z.string().optional().describe("Name must be a string."),
      surname: z.string().optional().describe("Name must be a string."),
      email: z.string().email("Please provide a valid email address"),
      jobRole: z.string().optional().describe("Job role must be a string."),
      branch: z.string().optional().describe("Branch must be a string."),
      gender: z
        .enum(["male", "female"])
        .optional()
        .describe("Gender must be one of: male, female"),
      lineManager: z
        .string()
        .optional()
        .refine((val) => val === undefined || /^[0-9a-fA-F]{24}$/.test(val), {
          message: "Line Manager must be a valid MongoDB ID.",
        }),
      reliever: z
        .string()
        .optional()
        .refine((val) => val === undefined || /^[0-9a-fA-F]{24}$/.test(val), {
          message: "Reliever must be a valid MongoDB ID.",
        }),
      levelId: z
        .string()
        .optional()
        .refine((val) => val === undefined || /^[0-9a-fA-F]{24}$/.test(val), {
          message: "Level ID must be a valid MongoDB ID.",
        }),
      isAdmin: z
        .boolean()
        .optional()
        .describe("isAdmin must be a boolean value (true or false)"),
    })
    .strict();

  validateProfilePhoto = (req: Request, res: Response, next: NextFunction) => {
    if (!req.files || !req.files.file) {
      return next();
    }

    if (Array.isArray(req.files.file)) {
      throw ApiError.badRequest("Please upload a single file");
    }

    const file = req.files.file;
    const validFileTypes = [
      "text/csv",
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    // Validate file type
    if (!validFileTypes.includes(file.mimetype)) {
      throw ApiError.badRequest(
        `Invalid file type. Allowed types are: ${validFileTypes.join(", ")}`
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      throw ApiError.badRequest(
        `File size exceeds the maximum allowed limit of ${
          maxSize / 1024 / 1024
        } MB.`
      );
    }

    next();
  };

  validateBulkInviteFile = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.files) {
      throw ApiError.badRequest("Please upload a file");
    }

    const file = req.files.file;

    if (!file) {
      throw ApiError.badRequest("Please upload a file");
    }

    if (Array.isArray(file)) {
      throw ApiError.badRequest("Please upload a single file");
    }

    const validFileTypes = ["text/csv"];

    if (!validFileTypes.includes(file.mimetype)) {
      throw ApiError.badRequest(
        "Invalid file type. Only CSV files are allowed"
      );
    }

    // Check if file size is acceptable (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      throw ApiError.badRequest(
        "File size exceeds the maximum allowed size (10MB)"
      );
    }

    next();
  };
}

export const employeeSchemas = new EmployeeSchemas();
