import type { Document, ObjectId, Types } from "mongoose";

export type UserRolesEnum = ("user" | "admin" | "client" | "employee")[];

export interface IUser extends Document {
  _id: ObjectId | string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | undefined;
  phoneNumber: string;
  password: string | undefined;
  isEmailVerified: boolean;
  onboarded: boolean;
  roles: UserRolesEnum;
}

export interface updateUserDTO {
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  phoneNumber: string;
  password: string | undefined;
  document: { type: string; url: string } | null;
  preferences: string[];
  isActive: boolean;
  isVerified: boolean;
  roles: UserRolesEnum;
}

export interface AuthenticatedUser {
  userId: Types.ObjectId;
  roles: UserRolesEnum;
  email?: string;
}
