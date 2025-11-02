import mongoose from "mongoose";
import { env } from "./env.config";
import logger from "../utils/logger";

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    logger.info("DB already connected");
    return;
  }

  try {
    logger.info("Connecting...");
    await mongoose.connect(env.MONGODB_URI, {
      dbName: env.NODE_ENV == "development" ? "LeaveMS" : "LeaveMS-Live",
    });
    logger.info("DB Connected!");
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    throw error;
  }
};

export default connectDB;
