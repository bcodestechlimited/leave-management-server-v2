import { isAuth, isEmployee } from "@/middleware/auth";
import { clientMiddleware } from "@/middleware/client.middleware";
import { Router } from "express";
import { leaveBalanceController } from "./leave-balance.controller";
import methodNotAllowed from "@/middleware/methodNotAllowed";
import { validateBody } from "@/middleware/validateSchema";
import { leaveBalanceSchemas } from "./leave-balance.schema";

const router = Router();

router
  .route("/")
  .get(
    clientMiddleware,
    isAuth,
    isEmployee,
    leaveBalanceController.getLeaveBalance
  )
  .all(methodNotAllowed);

router
  .route("/:leaveBalanceId")
  .get(clientMiddleware, isAuth, leaveBalanceController.getSingleLeaveBalance)
  .put(
    clientMiddleware,
    isAuth,
    validateBody(leaveBalanceSchemas.leaveBalance),
    leaveBalanceController.updateLeaveBalance
  )
  .all(methodNotAllowed);

export default router;
