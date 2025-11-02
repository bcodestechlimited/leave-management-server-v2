import { isAuth, isClientAdmin } from "@/middleware/auth";
import { clientMiddleware } from "@/middleware/client.middleware";
import methodNotAllowed from "@/middleware/methodNotAllowed";
import { Router } from "express";
import { linkController } from "./link.controller";

const router = Router();

router
  .route("/")
  .get(clientMiddleware, isAuth, isClientAdmin, linkController.getAllLinks)
  .all(methodNotAllowed);

export default router;
