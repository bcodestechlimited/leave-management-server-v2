import type { Document, Types } from "mongoose";

export default interface ILink extends Document {
  clientId: Types.ObjectId;
  token: string;
  url: string;
  email: string;
  expiresAt: Date;
  hasBeenUsed: boolean;
  isDelivered: boolean;
  status: "pending" | "accepted" | "expired";
}
