import { Document, Types } from "mongoose";
import type { IClient } from "../client/client.interface";

export interface IEmployee extends Document {
  clientId: IClient;
  staffId?: string | null;
  firstname?: string;
  middlename?: string;
  surname?: string;
  gender?: "male" | "female";
  accountType?: "employee" | "lineManager";
  name?: string;
  username?: string;
  email: string;
  password: string | undefined;
  avatar?: string;
  jobRole?: string;
  branch?: string;
  documents?: {
    _id: Types.ObjectId;
    url: string;
    fileType: "image" | "document";
  }[];
  isOnLeave?: boolean;
  isAdmin?: boolean;
  isActive?: boolean;
  isEmailVerified?: boolean;
  lineManager?: IEmployee | null;
  reliever?: IEmployee | null;
  levelId?: Types.ObjectId | null;
  atsInfo?: Record<string, any>;

  createdAt?: Date;
  updatedAt?: Date;

  // Methods
  getLeaveBalances: (
    employeeId: string,
    clientId: string
  ) => Promise<
    {
      leaveTypeId: Types.ObjectId;
      balance: number;
      leaveTypeDetails: {
        name: string;
        defaultBalance: number;
      };
    }[]
  >;
}

// export interface IEmployeeModel extends Model<IEmployeeDocument> {
//   getEmployeeStats: () => Promise<{
//     byLevel: {
//       levelId: Types.ObjectId;
//       levelName: string;
//       totalEmployees: number;
//     }[];
//     totalEmployees: number;
//   }>;
// }
