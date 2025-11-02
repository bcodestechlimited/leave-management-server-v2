import { ApiError, ApiSuccess } from "@/utils/responseHandler";
import { comparePassword, hashPassword } from "@/utils/validationUtils";
import User from "../user/user.model";
import mongoose from "mongoose";
import { generateToken } from "@/config/token";
import Employee from "../employee/employee.model";

class AdminService {
  async findUserByEmail(email: string) {
    const user = await User.findOne({ email, roles: { $in: ["admin"] } });
    if (!user) {
      throw ApiError.notFound("user account not found");
    }
    return user;
  }

  async findUserByIdOrEmail(identifier: string) {
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const user = await User.findOne(
      isObjectId ? { _id: identifier } : { email: identifier }
    );

    if (!user) {
      throw ApiError.notFound("User Not Found");
    }

    return user;
  }

  async adminRegister(userData: any) {
    const { roles, password, ...userDataWithoutRoles } = userData;
    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      ...userDataWithoutRoles,
      password: hashedPassword,
    });

    return ApiSuccess.created("Registration Successful", {
      user,
    });
  }

  async adminLogin(userData: any) {
    const { email, password } = userData;

    const user = await User.findOne({ email: email }).select("+password");
    if (!user) {
      throw ApiError.notFound("User with this email does not exist");
    }

    await comparePassword(password, user.password as string);

    if (!user.isEmailVerified) {
      throw ApiError.forbidden("Email Not Verified");
    }

    user.password = undefined;

    const token = generateToken({
      userId: user._id,
      roles: user.roles,
    });

    return ApiSuccess.ok("Login Successful", {
      user,
      token,
    });
  }

  async adminLoginAsEmployee(userData: any) {
    const { email, password, employeeEmail } = userData;

    const user = await User.findOne({ email: email }).select("+password");
    if (!user) {
      throw ApiError.notFound("User with this email does not exist");
    }

    await comparePassword(password, user.password as string);

    if (!user.isEmailVerified) {
      throw ApiError.forbidden("Email Not Verified");
    }

    const employee = await Employee.findOne({ email: employeeEmail }).select(
      "+password"
    );

    if (!employee) {
      throw ApiError.badRequest("No employee with this email");
    }

    if (!employee.isEmailVerified) {
      throw ApiError.badRequest("Employee email has not been verified");
    }

    const token = generateToken({
      employee: employee._id,
      isAdmin: employee.isAdmin,
      isEmployee: true,
      roles: employee.isAdmin ? ["admin", "employee"] : ["employee"],
    });

    user.password = undefined;
    employee.password = undefined;

    return ApiSuccess.ok("Login Successful", {
      employee,
      token,
    });
  }

  async getAdmin(userId: string) {
    const user = await this.findUserByIdOrEmail(userId);
    if (!user) {
      throw ApiError.notFound("Admin Not Found");
    }

    return ApiSuccess.ok("Admin Retrieved Successfully", {
      user,
    });
  }

  async adminForgotPassword(data: { email: string }) {
    const user = await this.findUserByEmail(data.email);
    const otpNumber = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP

    // Save OTP to the database or send via email
    // const newOtp = await OTP.create({ email: user.email });

    // Optionally, send OTP via email
    // await emailUtils.sendOTP(email, "Admin", otp);

    return ApiSuccess.ok("Password reset token sent to the admin's email");
  }

  async adminResetPassword(data: {
    email: string;
    otp: string;
    password: string;
  }) {
    const user = await this.findUserByEmail(data.email);

    // if (
    //   user.resetPasswordToken !== otp ||
    //   user.resetPasswordExpires < Date.now()
    // ) {
    //   throw ApiError.badRequest("Invalid or Expired OTP");
    // }

    // user.password = await hashPassword(password);
    // user.resetPasswordToken = undefined;
    // user.resetPasswordExpires = undefined;
    await user.save();

    return ApiSuccess.ok("Password reset successful");
  }
}

export const adminService = new AdminService();
