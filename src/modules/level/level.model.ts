import mongoose, { Schema } from "mongoose";
import type ILevel from "./level.interface";

const levelSchema: Schema<ILevel> = new Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    name: {
      type: String,
      required: true,
      lowercase: true,
    },
    leaveTypes: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "LeaveType",
          required: true,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const Level = mongoose.model<ILevel>("Level", levelSchema);

export default Level;
