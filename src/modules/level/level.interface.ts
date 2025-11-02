import type { Document } from "mongoose";
import type { IClient } from "../client/client.interface";
import type ILeaveType from "../leave-type/leave-type.interface";

export default interface ILevel extends Document {
  clientId: IClient;
  name: string;
  leaveTypes: ILeaveType[];
}
