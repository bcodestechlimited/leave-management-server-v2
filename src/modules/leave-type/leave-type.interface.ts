import type { Document, Types } from "mongoose";

export default interface ILeaveType extends Document {
  clientId: Types.ObjectId;
  name: string;
  levelId: Types.ObjectId;
  defaultBalance: number;
  isActive: boolean;
}
