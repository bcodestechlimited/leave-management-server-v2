import mongoose from "mongoose";
import asyncWrapper from "./asyncWrapper.js";
import { ApiError } from "@/utils/responseHandler.js";
import { clientService } from "@/modules/client/client.service.js";

const clientMiddleware = asyncWrapper(async (req, res, next) => {
  const clientId = req.headers["x-client-id"];

  if (!clientId || !mongoose.isValidObjectId(clientId)) {
    throw ApiError.unauthorized("Client ID is required");
  }

  await clientService.getClient(clientId as string);
  req.client = { clientId: clientId as string };
  next();
});

export { clientMiddleware };
