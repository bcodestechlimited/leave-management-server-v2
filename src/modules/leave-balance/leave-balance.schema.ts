import { z } from "zod";

class LeaveBalanceSchemas {
  // 🟩 2. Create or update a leave balance record
  leaveBalance = z
    .object({
      employeeId: z
        .string({ required_error: "employeeId is required" })
        .regex(/^[0-9a-fA-F]{24}$/, "employeeId must be a valid MongoDB ID"),

      leaveTypeId: z
        .string({ required_error: "leaveTypeId is required" })
        .regex(/^[0-9a-fA-F]{24}$/, "leaveTypeId must be a valid MongoDB ID"),
    })
    .strict();
}

export const leaveBalanceSchemas = new LeaveBalanceSchemas();
