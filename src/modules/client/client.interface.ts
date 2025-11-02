import { Document } from "mongoose";

export interface IClient extends Document {
  email: string;
  password: string | undefined;
  name: string;
  logo: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}
