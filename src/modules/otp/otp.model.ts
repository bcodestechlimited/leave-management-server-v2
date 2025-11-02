import mongoose, { Document, Schema } from "mongoose";

interface IOTP extends Document {
  email: string;
  otp?: string | undefined;
  token?: string | undefined;
  createdAt: Date;
}

const otpSchema: Schema<IOTP> = new Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  otp: {
    type: String,
  },
  token: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // The document will be automatically deleted after 5 minutes (300 seconds)
  },
});

const OTP = mongoose.model<IOTP>("OTP", otpSchema);

export default OTP;
