import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
import { AuthController } from "./auth.controller.js";
import { isAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validateSchema.js";
import { authSchemas } from "./auth.schema.js";

const router = express.Router();

router
  .route("/")
  .get(isAuth, AuthController.getUser)
  .patch(
    isAuth,
    validateBody(authSchemas.update),
    authSchemas.validateFiles,
    AuthController.updateUser
  )
  .all(methodNotAllowed);

router
  .route("/signup")
  .post(validateBody(authSchemas.register), AuthController.register)
  .all(methodNotAllowed);

router
  .route("/signin")
  .post(validateBody(authSchemas.login), AuthController.login)
  .all(methodNotAllowed);

router
  .route("/logout")
  .get(isAuth, AuthController.logout)
  .all(methodNotAllowed);

router
  .route("/send-otp")
  .post(validateBody(authSchemas.sendOTP), AuthController.sendOTP)
  .all(methodNotAllowed);

router
  .route("/verify-otp")
  .post(validateBody(authSchemas.verifyOTP), AuthController.verifyOTP)
  .all(methodNotAllowed);

router
  .route("/forgot-password")
  .post(validateBody(authSchemas.forgotPassword), AuthController.forgotPassword)
  .all(methodNotAllowed);

router
  .route("/reset-password")
  .post(validateBody(authSchemas.resetPassword), AuthController.resetPassword)
  .all(methodNotAllowed);

// router
//   .route("/profile/notification")
//   .get(isAuth, AuthController.getUserGuarantor)
//   .patch(
//     isAuth,
//     validateBody(authSchemas.updateNextOfKin),
//     AuthController.updateUserGuarantor
//   )
//   .all(methodNotAllowed);

export default router;
