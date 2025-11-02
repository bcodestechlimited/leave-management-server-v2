import type { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";
import { ApiError } from "../utils/responseHandler";
import logger from "@/utils/logger";

// Middleware to validate request body using Zod
export const validateBody =
  (schema: ZodSchema<any>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      console.log({ body: req.body });

      schema.parse(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path[0],
          message:
            err.code === "unrecognized_keys"
              ? `Unrecognized key(s): ${err.keys?.join(", ")}`
              : err.message,
        }));
        logger.error({ errors });
        throw ApiError.unprocessableEntity("Validation Error", errors);
      }

      return next(error); // Ensure unexpected errors are properly forwarded
    }
  };

// Improved version of validateParams
export const validateParams =
  (schema: ZodSchema<any>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      // const parsedParams = schema.parse(req.params);
      // req.params = parsedParams;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path[0],
          message:
            err.code === "unrecognized_keys"
              ? `Unrecognized key(s): ${err.keys?.join(", ")}`
              : err.message,
        }));
        throw ApiError.unprocessableEntity("Validation Error", errors);
      }

      return next(error);
    }
  };

// Improved version of validateParams
export const validateQuery =
  (schema: ZodSchema<any>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      // const parsedQuery = schema.parse(req.query);
      // console.log({ parsedQuery });

      // req.query = parsedQuery;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path[0],
          message:
            err.code === "unrecognized_keys"
              ? `Unrecognized key(s): ${err.keys?.join(", ")}`
              : err.message,
        }));

        console.log({ errors });

        return void res.status(400).json({
          success: false,
          status: "Invalid Query Parameters",
          status_code: 400,
          errors,
        });
      }

      return next(error);
    }
  };
