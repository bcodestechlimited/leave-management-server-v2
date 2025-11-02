import { isAuth, isClientAdmin } from "@/middleware/auth";
import { clientMiddleware } from "@/middleware/client.middleware";
import { Router } from "express";
import { clientController } from "./client.controller";
import { validateBody } from "@/middleware/validateSchema";
import { clientSchemas } from "./client.schema";
import methodNotAllowed from "@/middleware/methodNotAllowed";

const router = Router();

//Authentication
router
  .route("/auth")
  .get(clientMiddleware, isAuth, isClientAdmin, clientController.getClient)
  .put(
    clientMiddleware,
    isAuth,
    isClientAdmin,
    validateBody(clientSchemas.update),
    clientSchemas.validateUpdateLogo,
    clientController.updateClientProfile
  )
  .all(methodNotAllowed);

router
  .route("/auth/signin")
  .post(validateBody(clientSchemas.login), clientController.clientLogin)
  .all(methodNotAllowed);

router
  .route("/auth/forgot-password")
  .post(
    validateBody(clientSchemas.forgotPassword),
    clientController.forgotPassword
  )
  .all(methodNotAllowed);

router
  .route("/auth/reset-password")
  .post(
    validateBody(clientSchemas.resetPassword),
    clientController.resetPassword
  )
  .all(methodNotAllowed);

// router
//   .route("/link")
//   .get(clientMiddleware, isAuth, isClientAdmin, getAllInviteLinks)
//   .all(methodNotAllowed);

// Employees
// router
//   .route("/employee")
//   .get(clientMiddleware, isAuth, isClientAdmin, getEmployees)
//   .all(methodNotAllowed);

// router
//   .route("/employee/:employeeId")
//   .get(
//     clientMiddleware,
//     isAuth,
//     isClientAdmin,
//     validateMongoIdParam("employeeId"),
//     getEmployee
//   )
//   .put(
//     clientMiddleware,
//     isAuth,
//     isClientAdmin,
//     employeeProfileUpdateValidator,
//     validateMongoIdParam("employeeId"),
//     updateEmployee
//   )
//   .delete(clientMiddleware, isAuth, isClientAdmin, deleteEmployee)
//   .all(methodNotAllowed);

// router
//   .route("/line-manager")
//   .post(
//     clientMiddleware,
//     isAuth,
//     isClientAdmin,
//     addEmployeeValidator,
//     addLineManager
//   )
//   .all(methodNotAllowed);

// router
//   .route("/line-manager/:employeeId")
//   .delete(
//     clientMiddleware,
//     isAuth,
//     isClientAdmin,
//     validateMongoIdParam("employeeId"),
//     deleteLineManager
//   )
//   .all(methodNotAllowed);

// router
//   .route("/leave-report")
//   .get(clientMiddleware, isAuth, isClientAdmin, generateMonthlyLeaveReports)
//   .all(methodNotAllowed);

//Public
router
  .route("/:clientId")
  .get(clientController.validateClient)
  .all(methodNotAllowed);

export default router;
