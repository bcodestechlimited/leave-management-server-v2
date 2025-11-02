import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/responseHandler";

class LeaveSchemas {
  // 🟦 1. Leave request creation
  leaveRequest = z
    .object({
      leaveTypeId: z
        .string({ required_error: "Leave type ID is required" })
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid Leave type ID"),

      startDate: z
        .string({ required_error: "startDate is required" })
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid startDate",
        }),

      resumptionDate: z
        .string({ required_error: "resumptionDate is required" })
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid resumptionDate",
        }),

      duration: z
        .number({
          required_error: "duration is required",
          invalid_type_error: "duration must be a number",
        })
        .int()
        .min(0, "duration must be a positive integer"),

      reason: z
        .string({ required_error: "reason is required" })
        .min(1, "reason cannot be empty"),
    })
    .refine(
      (data) => {
        const start = new Date(data.startDate);
        const resume = new Date(data.resumptionDate);
        return resume > start;
      },
      {
        message: "resumptionDate must be after startDate",
        path: ["resumptionDate"],
      }
    );

  //  2. Leave request update (approve/reject)
  leaveRequestUpdate = z
    .object({
      status: z.enum(["approved", "rejected"], {
        required_error: "Status is required",
        invalid_type_error: "Status must be either 'approved' or 'rejected'",
      }),
      reason: z
        .string()
        .min(1, "Reason must be provided when status is rejected")
        .optional(),
    })
    .refine((data) => (data.status === "rejected" ? !!data.reason : true), {
      message: "Please provide a reason when rejecting a leave request",
      path: ["reason"],
    });

  // 3. File validation middleware (document upload)
  validateDocument(req: Request, _res: Response, next: NextFunction) {
    if (!req.files) return next();

    const { document } = req.files;

    if (!document) {
      throw ApiError.unprocessableEntity("No document uploaded");
    }

    const file = Array.isArray(document) ? document[0] : document;

    if (!file) {
      throw ApiError.unprocessableEntity("No document uploaded");
    }

    const allowedFileTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    if (!allowedFileTypes.includes(file.mimetype)) {
      throw ApiError.unprocessableEntity(
        `Invalid file type. Allowed types are: ${allowedFileTypes.join(", ")}`
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw ApiError.unprocessableEntity(
        `File size exceeds the maximum allowed limit of ${
          maxSize / 1024 / 1024
        } MB`
      );
    }

    next();
  }
}

export const leaveSchemas = new LeaveSchemas();
