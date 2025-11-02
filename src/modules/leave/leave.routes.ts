import { isAuth, isClientAdmin, isEmployee } from "@/middleware/auth";
import { clientMiddleware } from "@/middleware/client.middleware";
import methodNotAllowed from "@/middleware/methodNotAllowed";
import { Router } from "express";
import { leaveController } from "./leave.controller";
import { validateBody } from "@/middleware/validateSchema";
import { leaveSchemas } from "./leave.schema";

const router = Router();

// Leave Requests Routes
router
  .route("/")
  .get(clientMiddleware, leaveController.getLeaveRequests) // Get all leave requests for the client
  .post(
    clientMiddleware,
    isAuth,
    isEmployee,
    validateBody(leaveSchemas.leaveRequest),
    leaveController.leaveRequest
  ) // Request a new leave
  .all(methodNotAllowed);

router
  .route("/employee")
  .get(
    clientMiddleware,
    isAuth,
    isEmployee,
    leaveController.getEmployeeLeaveRequests
  ) // Get all leave requests for an employee
  .all(methodNotAllowed);

router
  .route("/manager")
  .get(
    clientMiddleware,
    isAuth,
    isEmployee,
    leaveController.getManagerLeaveRequests
  ) // Get all leave requests for a manager
  .all(methodNotAllowed);

router
  .route("/report")
  .get(
    clientMiddleware,
    isAuth,
    isClientAdmin,
    leaveController.getMonthlyLeaveRequestReport
  )
  .all(methodNotAllowed);

router
  .route("/:leaveRequestId")
  .get(clientMiddleware, isAuth, leaveController.getSingleLeaveRequest) // Get a specific leave request
  .put(
    clientMiddleware,
    isAuth,
    // leaveRequestUpdateValidator,
    validateBody(leaveSchemas.leaveRequestUpdate),
    leaveController.updateLeaveRequest
  )
  //   .delete(clientMiddleware, isAuth, leaveController.deleteLeaveRequest) // Delete leave request
  .all(methodNotAllowed);

router
  .route("/:leaveRequestId/client")
  .get(clientMiddleware, isAuth, leaveController.getSingleLeaveRequest) // Get a specific leave request
  .put(
    clientMiddleware,
    isAuth,
    // leaveRequestUpdateValidator,
    validateBody(leaveSchemas.leaveRequestUpdate),
    leaveController.updateLeaveRequest
  )
  // .delete(clientMiddleware, isAuth, deleteLeaveRequest) // Delete leave request
  .all(methodNotAllowed);

export default router;
