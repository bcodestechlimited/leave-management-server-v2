import express from "express";
import logger from "./utils/logger";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import fileUpload from "express-fileupload";
import connectDB from "./config/connectDB";
import notFound from "./middleware/notFound";
import { errorMiddleware } from "./middleware/error";
import { startAgenda } from "./lib/agenda";
import { env } from "./config/env.config";

//Routes
import authRoutes from "./modules/auth/auth.routes";
import adminRoutes from "./modules/admin/admin.routes";
import clientRoutes from "./modules/client/client.routes";
import employeeRoutes from "./modules/employee/employee.routes";
import leaveRoutes from "./modules/leave/leave.routes";
import leaveTypeRoutes from "./modules/leave-type/leave-type.routes";
import leaveBalanceRoutes from "./modules/leave-balance/leave-balance.routes";
import levelRoutes from "./modules/level/level.routes";
import linkRoutes from "./modules/link/link.routes";

// import { initializeSocket } from "./socket";

const app = express();
// const port = process.env.PORT || 3000;
const port = env.PORT || 3000;

app.use(cors({ origin: ["http://localhost:3000", "http://localhost:5173"] }));
// app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // Limits file size to 50MB
    useTempFiles: true,
    tempFileDir: "/tmp/",
    parseNested: true,
    // debug: true,
  })
);
app.use(morgan("dev"));
app.get("/", (req, res) => {
  res.send("Leave Management System API is running...");
});

// Mounting Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use("/api/v1/client", clientRoutes);
app.use("/api/v1/employee", employeeRoutes);
app.use("/api/v1/leave", leaveRoutes);
app.use("/api/v1/leave-type", leaveTypeRoutes);
app.use("/api/v1/leave-balance", leaveBalanceRoutes);
app.use("/api/v1/level", levelRoutes);
app.use("/api/v1/link", linkRoutes);

app.use(helmet());
app.use(notFound);
app.use(errorMiddleware);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, async () => {
      logger.info(
        `Server is listening on PORT:${port} in ${env.NODE_ENV} environment`
      );
      // initializeSocket(server);
      startAgenda();
    });
  } catch (error) {
    logger.error(error);
  }
};

startServer();
