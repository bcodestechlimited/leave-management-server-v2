import mongoose from "mongoose";
import { env } from "./env.config";
import logger from "../utils/logger";

const isProd = env.NODE_ENV === "production";

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    logger.info("DB already connected");
    return;
  }

  if (process.versions.bun) {
    const dns = await import("node:dns");
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
  }

  try {
    logger.info("Connecting...");
    await mongoose.connect(env.MONGODB_URI, {
      dbName: isProd ? "LeaveMS-Live-v2" : "LeaveMS-Stagging",
      // dbName: "LeaveMS-Live-v2",
    });
    logger.info(`DB Connected! environment: ${env.NODE_ENV}`);
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    throw error;
  }
};

export default connectDB;
