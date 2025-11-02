import { Router } from "express";
import { leaveTypeController } from "./leave-type.controller";
import { clientMiddleware } from "@/middleware/client.middleware";
import { isAuth, isClientAdmin } from "@/middleware/auth";
import methodNotAllowed from "@/middleware/methodNotAllowed";

const router = Router();

router
  .route("/")
  .get(clientMiddleware, leaveTypeController.getLeaveTypes) // Get all leave types for the client
  .post(
    clientMiddleware,
    isAuth,
    isClientAdmin,
    // leaveTypeValidator,
    leaveTypeController.addLeaveType
  ) // Add a new leave type
  .all(methodNotAllowed);

router
  .route("/:leaveTypeId")
  .put(
    clientMiddleware,
    isAuth,
    isClientAdmin,
    // leaveTypeUpdateValidator,
    leaveTypeController.getLeaveTypes
  ) // Update leave type
  .delete(
    clientMiddleware,
    isAuth,
    isClientAdmin,
    leaveTypeController.deleteLeaveType
  ) // Delete leave type
  .all(methodNotAllowed);

export default router;
