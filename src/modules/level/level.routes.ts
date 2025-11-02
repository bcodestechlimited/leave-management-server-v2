import { isAuth, isClientAdmin } from "@/middleware/auth";
import { clientMiddleware } from "@/middleware/client.middleware";
import { Router } from "express";
import { levelController } from "./level.controller";
import { validateBody } from "@/middleware/validateSchema";
import { levelSchemas } from "./level.schema";
import methodNotAllowed from "@/middleware/methodNotAllowed";

const router = Router();

// Level Routes
router
  .route("/")
  .get(clientMiddleware, isAuth, isClientAdmin, levelController.getLevels) // Get all levels for the client
  .post(
    clientMiddleware,
    isAuth,
    isClientAdmin,
    validateBody(levelSchemas.addLevel),
    levelController.addLevel
  ) // Add a new level
  .all(methodNotAllowed);

router
  .route("/:levelId")
  .get(clientMiddleware, isAuth, isClientAdmin, levelController.getLevel) // Get details of a specific level
  .put(
    clientMiddleware,
    isAuth,
    isClientAdmin,
    validateBody(levelSchemas.updateLevel),
    levelController.updateLevel
  ) // Update level
  .delete(clientMiddleware, isAuth, isClientAdmin, levelController.deleteLevel) // Delete level
  .all(methodNotAllowed);

export default router;
