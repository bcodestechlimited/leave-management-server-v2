import express from "express";
import { isAdmin, isAuth } from "@/middleware/auth.js";
import methodNotAllowed from "@/middleware/methodNotAllowed.js";
import { leaveController } from "../leave/leave.controller";
import { validateBody } from "@/middleware/validateSchema";
import { leaveSchemas } from "../leave/leave.schema";
import { employeeController } from "../employee/employee.controller";
import { employeeSchemas } from "../employee/employee.schema";
import { adminController } from "./admin.controller";
import { clientMiddleware } from "@/middleware/client.middleware";

const router = express.Router();

// ============================
// Auth
// ============================

router
  .route("/auth/login")
  .post(
    // validateBody(),
    adminController.adminLogin
  )
  .all(methodNotAllowed);

router
  .route("/auth/login/employee")
  .post(
    // adminLogInValidator,
    adminController.adminLoginAsEmployee
  )
  .all(methodNotAllowed);

router
  .route("/auth")
  .get(isAuth, isAdmin, adminController.getAdmin)
  .all(methodNotAllowed);

router
  .route("/auth/forgot-password")
  .post(
    // adminForgotPasswordValidator,
    adminController.adminForgotPassword
  )
  .all(methodNotAllowed);

router
  .route("/auth/reset-password")
  .post(
    // adminResetPasswordValidator
    adminController.adminResetPassword
  )
  .all(methodNotAllowed);

// ============================
// Client Routes
// ============================

router
  .route("/client")
  .post(
    isAuth,
    isAdmin,
    // validateBody(clientSchemas.update),
    adminController.addClient
  )
  .get(
    isAuth,

    isAdmin,
    adminController.getClients
  )
  .all(methodNotAllowed);

router
  .route("/client/:clientId")
  .get(isAuth, isAdmin, adminController.getClient)
  .all(methodNotAllowed);

// ============================
// Leaves
// ============================

router
  .route("/leave")
  .get(clientMiddleware, isAuth, isAdmin, leaveController.getLeaveRequests) // Get all leave requests for the client
  .all(methodNotAllowed);

router
  .route("/leave/analytics")
  .get(isAuth, isAdmin, leaveController.getLeaveRequestAnalytics)
  .all(methodNotAllowed);

router
  .route("/leave/report")
  .get(
    clientMiddleware,
    isAuth,
    isAdmin,
    leaveController.getMonthlyLeaveRequestReport
  )
  .all(methodNotAllowed);

router
  .route("/leave/analytics")
  .get(isAuth, isAdmin, leaveController.getLeaveRequestAnalytics)
  .all(methodNotAllowed);

router
  .route("/leave/:leaveRequestId")
  .get(isAuth, isAdmin, adminController.getSingleLeaveRequest) // Get a specific leave request
  .put(
    clientMiddleware,
    isAuth,
    isAdmin,
    validateBody(leaveSchemas.leaveRequestUpdate),
    adminController.updateLeaveRequest
  )
  .all(methodNotAllowed);

router
  .route("/employee")
  .get(isAuth, isAdmin, leaveController.getEmployeeLeaveRequests) // Get all leave requests for an employee
  .all(methodNotAllowed);

router
  .route("/manager")
  .get(isAuth, isAdmin, leaveController.getManagerLeaveRequests) // Get all leave requests for a manager
  .all(methodNotAllowed);

router
  .route("/leave-request/manager")
  .get(isAuth, isAdmin, leaveController.getManagerLeaveRequests) // Get all leave requests for a manager
  .all(methodNotAllowed);

router
  .route("/leave-request/:leaveRequestId")
  .get(isAuth, isAdmin, leaveController.getSingleLeaveRequest) // Get a specific leave request
  .put(
    isAuth,
    isAdmin,
    validateBody(leaveSchemas.leaveRequestUpdate),
    leaveController.updateLeaveRequest
  )
  //   .delete(clientMiddleware, isAuth, leaveController.deleteLeaveRequest) // Delete leave request
  .all(methodNotAllowed);

router
  .route("/leave-request/:leaveRequestId/client")
  .get(isAuth, isAdmin, leaveController.getSingleLeaveRequest) // Get a specific leave request
  .put(
    isAuth,
    isAdmin,
    validateBody(leaveSchemas.leaveRequestUpdate),
    leaveController.updateLeaveRequest
  )
  // .delete(clientMiddleware, isAuth, deleteLeaveRequest) // Delete leave request
  .all(methodNotAllowed);

// ============================
// Employee
// ============================

router
  .route("/employee")
  .get(isAuth, isAdmin, employeeController.getEmployees)
  .post(
    isAuth,
    isAdmin,
    validateBody(employeeSchemas.inviteValidation),
    employeeController.sendInvite
  )
  .all(methodNotAllowed);

router
  .route("/employee/:employeeId")
  .get(isAuth, isAdmin, employeeController.getEmployee)
  .put(
    isAuth,
    isAdmin,
    validateBody(employeeSchemas.employeeProfileUpdate),
    employeeController.updateEmployee
  )
  .all(methodNotAllowed);

export default router;
