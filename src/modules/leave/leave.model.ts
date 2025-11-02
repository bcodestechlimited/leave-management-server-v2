import mongoose, { Document, Schema, Types } from "mongoose";
import type ILeave from "./leave.interface";

const leaveSchema: Schema<ILeave> = new Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    reliever: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    lineManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    resumptionDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reason: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
    approvalReason: {
      type: String,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    approvalCount: {
      type: Number,
      default: 0,
    },
    balanceBeforeLeave: {
      type: Number,
      default: 0,
    },
    remainingDays: {
      type: Number,
      default: 0,
    },
    leaveSummary: {
      type: {
        balanceBeforeLeave: {
          type: Number,
          default: 0,
        },
        balanceAfterLeave: {
          type: Number,
          default: 0,
        },
        remainingDays: {
          type: Number,
          default: 0,
        },
      },
      default: {
        balanceBeforeLeave: 0,
        balanceAfterLeave: 0,
        remainingDays: 0,
      },
    },
    document: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Leave = mongoose.model<ILeave>("Leave", leaveSchema);

export default Leave;
