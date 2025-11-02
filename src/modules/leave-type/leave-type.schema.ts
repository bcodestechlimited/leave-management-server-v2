import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/responseHandler";

class LeaveTypeSchemas {
  // 1. Create new leave type
  leaveType = z
    .object({
      name: z
        .string({ required_error: "Leave type name is required" })
        .min(1, "Leave type name cannot be empty"),

      defaultBalance: z
        .number({
          required_error: "Default balance is required",
          invalid_type_error: "Default balance must be a number",
        })
        .int()
        .min(0, "Default balance must be a positive integer"),

      levelId: z
        .string({ required_error: "levelId is required" })
        .regex(/^[0-9a-fA-F]{24}$/, "levelId must be a valid Mongo ID"),
    })
    .strict();

  // 2. Update existing leave type
  leaveTypeUpdate = z
    .object({
      name: z.string().min(1, "Leave type name cannot be empty").optional(),

      defaultBalance: z
        .number({
          invalid_type_error: "Default balance must be a number",
        })
        .int()
        .min(0, "Default balance must be a positive integer")
        .optional(),

      levelId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "levelId must be a valid Mongo ID")
        .optional(),
    })
    .strict();
}

export const leaveTypeSchemas = new LeaveTypeSchemas();
