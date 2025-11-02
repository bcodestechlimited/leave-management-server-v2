import mongoose, { Document, Schema, Types } from "mongoose";
import type ILeaveBalance from "./leave-balance.interface";

const leaveBalanceSchema: Schema<ILeaveBalance> = new Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    leaveTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },
    balance: { type: Number, required: true },
  },
  { timestamps: true }
);

const LeaveBalance = mongoose.model<ILeaveBalance>(
  "LeaveBalance",
  leaveBalanceSchema
);

export default LeaveBalance;
