import mongoose, { Document, Schema, Types } from "mongoose";
import type ILeaveType from "./leave-type.interface";

const leaveTypeSchema: Schema<ILeaveType> = new Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    name: {
      type: String,
      required: true,
      lowercase: true,
    },
    levelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      required: true,
    },
    defaultBalance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const LeaveType = mongoose.model<ILeaveType>("LeaveType", leaveTypeSchema);

export default LeaveType;
