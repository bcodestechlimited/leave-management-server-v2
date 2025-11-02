import OTP from "../otp/otp.model.js";
import type {
  LoginDTO,
  OTPData,
  RegisterDTO,
  ResetPasswordDTO,
} from "./auth.interface.js";
import UserService from "../user/user.service.js";
import { comparePassword, hashPassword } from "../../utils/validationUtils.js";
import { ApiError, ApiSuccess } from "../../utils/responseHandler.js";
import { generateToken } from "../../config/token.js";
import type { Types } from "mongoose";
import agenda from "../../lib/agenda.js";
import type { updateUserDTO } from "../user/user.interface.js";
import type { UploadedFile } from "express-fileupload";
import type { IQueryParams } from "@/shared/interfaces/query.interface.js";
import { uploadService } from "@/services/upload.service.js";

export class AuthService {
  async register(userData: RegisterDTO) {
    const { email, roles } = userData;

    const user = await UserService.createUser({
      ...userData,
      roles: roles,
    });

    await user.save();
    user.password = undefined;

    agenda.now("send_otp_email", {
      email: user.email,
      username: user.firstName,
    });

    return ApiSuccess.created(
      `Registration successful. OTP will be sent to ${email} shortly.`,
      { user }
    );
  }

  async login(userData: LoginDTO) {
    const { email, password } = userData;
    console.log({ userData });

    const user = await UserService.findUserByEmail(email);

    console.log({ password, userPassword: user });
    await comparePassword(password, user.password as string);

    if (!user.isEmailVerified) {
      throw ApiError.forbidden("Email Not Verified");
    }
    const token = generateToken({ userId: user._id, roles: user.roles });

    return ApiSuccess.ok("Login Successful", {
      user,
      token,
    });
  }

  async getUser(userId: Types.ObjectId) {
    const user = await UserService.findUserById(userId);
    user.password = undefined;
    return ApiSuccess.ok("User Retrieved Successfully", {
      user,
    });
  }
  async updateUser(
    userId: Types.ObjectId,
    userData: Partial<updateUserDTO>,
    files?: { document?: UploadedFile; avatar?: UploadedFile }
  ) {
    const UpdatedUserData = {
      ...userData,
    };

    if (files && files.document) {
      const { document } = files;
      const { secure_url, resource_type } =
        await uploadService.uploadToCloudinary(document.tempFilePath);

      UpdatedUserData.document = {
        type: resource_type === "image" ? "image" : "file",
        url: secure_url as string,
      };
    }

    if (files && files.avatar) {
      const { secure_url } = await uploadService.uploadToCloudinary(
        files.avatar.tempFilePath
      );
      UpdatedUserData.avatar = secure_url as string;
    }

    console.log({ UpdatedUserData, files });

    const user = await UserService.updateUser(userId, UpdatedUserData);
    user.password = undefined;
    return ApiSuccess.ok("Profile Updated Successfully", {
      user,
    });
  }

  async sendOTP({ email }: { email: string }) {
    const user = await UserService.findUserByEmail(email);
    if (user.isEmailVerified) {
      return ApiSuccess.ok("User Already Verified");
    }

    agenda.now("send_otp_email", {
      email: user.email,
      username: user.firstName,
    });

    return ApiSuccess.ok(`OTP has been sent to ${email}`);
  }

  async verifyOTP({ email, otp }: OTPData) {
    const user = await UserService.findUserByEmail(email);
    if (user.isEmailVerified) {
      return ApiSuccess.ok("User Already Verified");
    }

    const otpExists = await OTP.findOne({ email, otp });
    if (!otpExists) {
      throw ApiError.notFound("Invalid or Expired OTP");
    }
    user.isEmailVerified = true;
    await user.save();
    return ApiSuccess.ok("Email Verified");
  }

  async forgotPassword({ email }: { email: string }) {
    const user = await UserService.findUserByEmail(email);
    agenda.now("send_otp_email", {
      email: user.email,
      username: user.firstName,
    });
    return ApiSuccess.ok(`OTP has been sent to ${user.email}`);
  }

  async resetPassword({ email, otp, password }: ResetPasswordDTO) {
    const user = await UserService.findUserByEmail(email);
    const otpExists = await OTP.findOne({ email, otp });
    if (!otpExists) {
      throw ApiError.badRequest("Invalid or Expired OTP");
    }
    user.password = await hashPassword(password);
    await user.save();
    return ApiSuccess.ok("Password Updated");
  }
}

export const authService = new AuthService();
