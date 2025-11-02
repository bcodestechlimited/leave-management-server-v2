import { isAdmin, isAuth, isClientAdmin, isEmployee } from "@/middleware/auth";
import { clientMiddleware } from "@/middleware/client.middleware";
import methodNotAllowed from "@/middleware/methodNotAllowed";
import { Router } from "express";
import { employeeController } from "./employee.controller";
import { employeeSchemas } from "./employee.schema";
import { validateBody } from "@/middleware/validateSchema";

const router = Router();

router
  .route("/")
  .get(clientMiddleware, isAuth, employeeController.getEmployee)
  .all(methodNotAllowed);

//Authentication
router
  .route("/auth")
  .get(clientMiddleware, isAuth, isEmployee, employeeController.getAuthEmployee)
  .put(
    clientMiddleware,
    isAuth,
    isEmployee,
    validateBody(employeeSchemas.employeeProfileUpdate),
    employeeController.updateEmployee
  )
  .all(methodNotAllowed);

router
  .route("/auth/signin")
  .post(validateBody(employeeSchemas.login), employeeController.login)
  .all(methodNotAllowed);

// router
//   .route("/auth/signup")
//   .post(
//     clientMiddleware,
//     validateBody(employeeSchemas.login),
//     employeeController.register
//   )
//   .all(methodNotAllowed);

router
  .route("/auth/forgot-password")
  .post(
    validateBody(employeeSchemas.forgotPasswordValidation),
    employeeController.forgotPassword
  )
  .all(methodNotAllowed);

router
  .route("/auth/reset-password")
  .post(
    validateBody(employeeSchemas.resetPassword),
    employeeController.resetPassword
  )
  .all(methodNotAllowed);

//Invites
router
  .route("/invite")
  .post(
    clientMiddleware,
    isAuth,
    isClientAdmin,
    validateBody(employeeSchemas.inviteValidation),
    employeeController.sendInvite
  )
  .put(clientMiddleware, employeeController.acceptInvite)
  .all(methodNotAllowed);

//Emergency Feature
router
  .route("/add")
  .post(
    clientMiddleware,
    isAuth,
    isClientAdmin,
    employeeController.inviteAndAdd
  )
  .all(methodNotAllowed);

router
  .route("/bulk-invite")
  // .post(
  //   clientMiddleware,
  //   isAuth,
  //   isClientAdmin,
  //   employeeSchemas.validateBulkInviteFile,
  //   employeeController.bulkInvite
  // )
  .all(methodNotAllowed);

// Employee Admins
router
  .route("/admin/employee/:employeeId")
  .put(
    clientMiddleware,
    isAuth,
    isAdmin,
    validateBody(employeeSchemas.updateEmployeeAdminStatus),
    employeeController.updateEmployee
  )
  .all(methodNotAllowed);

export default router;
