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

router
  .route("/:linkId")
  .get(clientMiddleware, isAuth, isClientAdmin, linkController.getLink)
  .put(clientMiddleware, isAuth, isClientAdmin, linkController.updateLink)
  .all(methodNotAllowed);

export default router;
