import type { Document, Types } from "mongoose";

export default interface ILeaveBalance extends Document {
  clientId: Types.ObjectId;
  employeeId: Types.ObjectId;
  leaveTypeId: Types.ObjectId;
  balance: number;
}
