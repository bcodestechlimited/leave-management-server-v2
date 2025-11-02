import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../config/token.js";
import asyncWrapper from "./asyncWrapper.js";
import { ApiError } from "../utils/responseHandler.js";

const isAuth = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.unauthorized("No Token Provided");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw ApiError.unauthorized("No Token Provided");
    }

    const payload = verifyToken(token);
    
    if (payload?.roles.includes("admin")) {
      req.admin = payload;
    }

    // if (payload?.isClientAdmin) {
    //   req.clientAdmin = payload;
    // }

    // if (payload?.isAdmin) {
    //   req.admin = payload;
    // }

    if (payload?.roles.includes("employee")) {
      req.employee = { ...payload, employeeId: payload.employeeId };
    }
    //Holds whichever user is logged in
    req.user = payload;
    // console.log({ user: req.user });

    next();
  }
);

//Checks if the user/employee is an admin
const isSuperAdmin = asyncWrapper(async (req, res, next) => {
  if (!req?.user?.isSuperAdmin) {
    throw ApiError.unauthorized("Super Admins Only");
  }
  next();
});

//Checks if the user/employee is an admin
const isAdmin = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized("Admins Only");
    }
    if (!req.user || !req.user.roles.includes("admin")) {
      throw ApiError.forbidden("Admins Only");
    }

    next();
  }
);

//Checks if the user/employee is an employee
const isEmployee = asyncWrapper(async (req, res, next) => {
  if (!req?.user?.isEmployee) {
    throw ApiError.unauthorized("Employees Only");
  }
  next();
});

//Checks if the user is a Client Admin
const isClientAdmin = asyncWrapper(async (req, res, next) => {
  if (!req?.user?.isClientAdmin || !req?.user?.isAdmin) {
    throw ApiError.unauthorized("Client Admins Only");
  }
  next();
});

const isClientAdminOrAdmin = asyncWrapper(async (req, res, next) => {
  if (!req?.user?.isClientAdmin || !req?.user?.isAdmin) {
    throw ApiError.unauthorized("Client Admins and Admins Only");
  }
  next();
});

export {
  isAuth,
  isSuperAdmin,
  isClientAdmin,
  isAdmin,
  isEmployee,
  isClientAdminOrAdmin,
};
