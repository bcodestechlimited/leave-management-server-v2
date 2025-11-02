import mongoose, { Schema, Types } from "mongoose";
import type { IUser } from "./user.interface";

const UserSchema: Schema<IUser> = new Schema(
  {
    firstName: {
      type: String,
      trim: true,
      required: [true, "Please provide a username"],
    },
    lastName: {
      type: String,
      trim: true,
      required: [true, "Please provide a last name"],
    },
    avatar: {
      type: String,
      trim: true,
      default: "https://github.com/shadcn.png",
    },
    email: {
      type: String,
      required: [true, "Please provide an email address"],
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
        "Please provide a valid email address",
      ],
      unique: [true, "User with this email already exists"],
    },
    password: {
      type: String,
      trim: true,
      select: false,
      required: [true, "Please provide a password"],
    },
    roles: {
      type: [String],
      enum: ["user", "admin"],
      default: ["user"],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
