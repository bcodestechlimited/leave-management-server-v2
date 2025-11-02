import mongoose, { Schema } from "mongoose";
import type { IClient } from "./client.interface";

const ClientSchema: Schema<IClient> = new Schema(
  {
    email: {
      type: String,
      required: [true, "Please provide an email"],
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
        "Please provide a valid email",
      ],
      unique: [true, "User with this email already exists"],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      select: false,
    },
    name: {
      type: String,
      required: [true, "Please provide a name"],
      unique: true,
      trim: true,
    },
    logo: {
      type: String,
      required: [true, "Please provide a logo URL"],
      trim: true,
    },
    color: {
      type: String,
      required: [true, "Please provide a color"],
      validate: {
        validator: function (v: string) {
          return /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(v);
        },
        message: (props: any) =>
          `${props.value} is not a valid HEX color code!`,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Client = mongoose.model<IClient>("Client", ClientSchema);

export default Client;
