import type { Document, Types } from "mongoose";
import type { IClient } from "../client/client.interface";
import type { IEmployee } from "../employee/employee.interface";
import type ILeaveType from "../leave-type/leave-type.interface";

export default interface ILeave extends Document {
  clientId: IClient;
  employee: IEmployee;
  reliever: IEmployee;
  lineManager: IEmployee;
  leaveType: ILeaveType;
  startDate: Date;
  resumptionDate: Date;
  duration: number;
  status: "pending" | "approved" | "rejected";
  reason: string;
  rejectionReason?: string | undefined;
  approvalReason?: string;
  approvedBy?: IEmployee | null;
  rejectedBy?: IEmployee | null;
  approvalCount?: number;
  balanceBeforeLeave?: number;
  remainingDays?: number;
  leaveSummary: {
    balanceBeforeLeave: number;
    balanceAfterLeave: number;
    remainingDays: number;
  };
  document?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
