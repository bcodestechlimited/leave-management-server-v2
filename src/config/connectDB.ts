import mongoose from "mongoose";
import { env } from "./env.config";
import logger from "../utils/logger";

const isDev = env.NODE_ENV === "development";

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    logger.info("DB already connected");
    return;
  }

  try {
    logger.info("Connecting...");
    await mongoose.connect(env.MONGODB_URI, {
      dbName: isDev ? "LeaveMS-Stagging" : "LeaveMS-Live-v2",
      // dbName: "LeaveMS-Live-v2",
    });
    logger.info(`DB Connected! environment: ${env.NODE_ENV}`);
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    throw error;
  }
};

export default connectDB;
