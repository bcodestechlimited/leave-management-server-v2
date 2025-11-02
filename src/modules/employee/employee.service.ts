import crypto from "crypto";
import { paginate } from "../../utils/paginate.js";
import { hashPassword, comparePassword } from "../../utils/validationUtils.js";
import { generateToken, verifyToken } from "../../config/token.js";
import {
  extractAndValidateData,
  parseCSVFile,
  saveFileToUploads,
} from "../../utils/csvParserUtil.js";

import type { UploadedFile } from "express-fileupload";
import { uploadService } from "@/services/upload.service.js";
import { response } from "express";
import { mailService } from "@/services/mail.service.js";
import Employee from "./employee.model.js";
import { ApiError, ApiSuccess } from "@/utils/responseHandler.js";
import { clientService } from "../client/client.service.js";
import Link from "../link/link.model.js";
import type { IEmployee } from "./employee.interface.js";
import Leave from "../leave/leave.model.js";
import LeaveBalance from "../leave-balance/leave-balance.model.js";
import { otpService } from "../otp/otp.service.js";
import type { IQueryParams } from "@/shared/interfaces/query.interface.js";

export class EmployeeService {
  // ---------------- AUTH ----------------
  async signIn(employeeData: { email: string; password: string }) {
    const { email, password } = employeeData;
    const employee = await Employee.findOne({ email }).select("+password");

    if (!employee) throw ApiError.badRequest("No User with this email");
    if (!employee.isEmailVerified) {
      throw ApiError.badRequest("Email has not been verified");
    }

    await comparePassword(password, employee.password as string);

    const token = generateToken({
      employeeId: employee._id,
      isAdmin: employee.isAdmin,
      isEmployee: true,
      roles: employee.isAdmin ? ["admin", "employee"] : ["employee"],
    });

    employee.password = undefined;

    return ApiSuccess.created("Login successful", {
      employee,
      token,
    });
  }

  // ---------------- INVITES ----------------
  async sendInviteToEmployee(
    inviteData: { email: string; expiresIn: number },
    clientId: string
  ) {
    const { email, expiresIn } = inviteData;
    if (!email || !clientId)
      throw ApiError.badRequest("Email and clientId are required");

    const { data } = await clientService.getClient(clientId);
    const client = data?.client;
    if (!client) throw ApiError.notFound("client not found");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresIn);

    let employee = await Employee.findOne({ email, clientId });
    const existingLink = await Link.findOne({ email, clientId }).sort({
      createdAt: -1,
    });

    // Already accepted
    if (existingLink && existingLink.status === "accepted") {
      return ApiSuccess.ok(
        `Invite already accepted for ${email}. No action taken.`
      );
    }

    const generatePassword = async () => {
      const plain = crypto.randomBytes(8).toString("hex");
      const hash = await hashPassword(plain);
      return { plain, hash };
    };

    let token: string;
    let inviteUrl: string;
    let plainPassword: string;

    // Case 1: No employee exists
    if (!employee) {
      const { plain, hash } = await generatePassword();
      plainPassword = plain;

      employee = await Employee.create({
        email,
        clientId,
        password: hash,
      });

      token = crypto.randomBytes(20).toString("hex");
      inviteUrl = `${process.env.FRONTEND_URL}/${client._id}/verify?token=${token}`;

      await Link.create({
        clientId,
        token,
        email,
        url: inviteUrl,
        expiresAt,
        status: "pending",
      });

      await this.sendInviteEmail(
        email,
        plainPassword,
        client.name,
        inviteUrl,
        token
      );
      return ApiSuccess.ok(`Invite link sent to ${email}`);
    }

    // Case 2: Active link exists
    if (existingLink && existingLink.expiresAt > new Date()) {
      const { plain, hash } = await generatePassword();
      plainPassword = plain;
      await Employee.findByIdAndUpdate(employee._id, { password: hash });

      token = existingLink.token;
      inviteUrl = existingLink.url;

      await this.sendInviteEmail(
        email,
        plainPassword,
        client.name,
        inviteUrl,
        token
      );
      return ApiSuccess.ok(
        `New password sent using active invite link for ${email}`
      );
    }

    // Case 3: Expired link or none
    const { plain, hash } = await generatePassword();
    plainPassword = plain;
    await Employee.findByIdAndUpdate(employee._id, { password: hash });

    token = crypto.randomBytes(20).toString("hex");
    inviteUrl = `${process.env.FRONTEND_URL}/${client._id}/verify?token=${token}`;

    await Link.create({
      clientId,
      token,
      email,
      url: inviteUrl,
      expiresAt,
      status: "pending",
    });

    await this.sendInviteEmail(
      email,
      plainPassword,
      client.name,
      inviteUrl,
      token
    );
    return ApiSuccess.ok(`New invite link sent to ${email}`);
  }

  async acceptInvite(token: string, clientId: string) {
    const link = await Link.findOne({ token, clientId });
    if (!link) throw ApiError.notFound("Invite link not valid");

    if (link.hasBeenUsed) throw ApiError.badRequest("This link has been used");

    if (new Date() > new Date(link.expiresAt)) {
      link.status = "expired";
      await link.save();
      throw ApiError.badRequest("Invite link has expired");
    }

    const employee = await Employee.findOne({ email: link.email, clientId });
    if (!employee) throw ApiError.notFound("Invite link not valid");

    employee.isEmailVerified = true;
    link.hasBeenUsed = true;
    link.status = "accepted";

    await Promise.all([employee.save(), link.save()]);

    return ApiSuccess.created("Invitation Accepted", { employee });
  }

  async InviteAndAddEmployee(
    InviteData: any,
    employeeId: string,
    clientId: string
  ) {
    const { email, firstname, middlename, surname, accountType } = InviteData;

    const employee = await Employee.findOne({ email, clientId });
    if (employee) {
      throw ApiError.badRequest("Employee with this email already exists");
    }

    const currentEmployee = await Employee.findOne({
      _id: employeeId,
      clientId,
    });

    if (!currentEmployee) throw ApiError.notFound("Employee not found");

    const fullname = [currentEmployee.firstname, currentEmployee.surname]
      .filter(Boolean)
      .join(" ");

    const { data } = await clientService.getClient(clientId);
    const client = data?.client;

    const plainPassword = crypto.randomBytes(8).toString("hex"); // 8 characters
    const hashedPassword = await hashPassword(plainPassword);

    // Create a new employee
    const newEmployee = new Employee({
      email,
      firstname,
      middlename: middlename ? middlename : "",
      surname,
      accountType,
      clientId,
      password: hashedPassword,
      isEmailVerified: true,
    });

    const inviteUrl = `${process.env.FRONTEND_URL}/login`;
    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: email,
      subject: `Invite to ${client.name} Leave Board`,
      text: `Hello, you have been invited to join ${client.name} leave board by ${fullname}. Your temporary password is: ${plainPassword}. Click on the following link to login to your account: ${inviteUrl}`,
      html: `
      <p>Hi, ${newEmployee.firstname}</p>
      <p>You have been invited to join <strong>${client.name}</strong> leave board.</p>
      <p>Your temporary password is: <strong>${plainPassword}</strong></p>
      <p>Click on the following link to login in</p>
      <a href="${inviteUrl}">Go To Leave Board</a>
    `,
    };

    try {
      await mailService.sendEmail(mailOptions);
      await newEmployee.save();
      return ApiSuccess.ok(`User added successfully`);
    } catch (error) {
      console.log(error);
      return ApiError.internalServerError(`Error inviting ${email}`);
    }
  }

  // ---------------- EMPLOYEES ----------------
  async getEmployee(clientId: string, employeeId: string) {
    const employee = await Employee.findOne({
      _id: employeeId,
      clientId,
    }).populate([
      { path: "clientId" },
      { path: "lineManager" },
      { path: "levelId", select: "name" },
      { path: "reliever" },
    ]);

    if (!employee) throw ApiError.notFound("Employee not found");

    // const leaveBalances = await employee.getLeaveBalances(employeeId, clientId);

    return ApiSuccess.ok("Employee Retrieved Successfully", {
      employee,
      // leaveBalances,
    });
  }

  async getEmployees(clientId: string, query: IQueryParams) {
    const {
      page = 1,
      limit = 10,
      search,
      sort = { createdAt: -1 },
      accountType,
    } = query;

    const filter: Record<string, any> = { clientId };
    if (accountType) filter.accountType = accountType;

    if (search) {
      filter.$or = [
        { staffId: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { firstname: { $regex: search, $options: "i" } },
        { surname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const { documents: employees, pagination } = await paginate({
      model: Employee,
      query: filter,
      page,
      limit,
      sort,
      populateOptions: [
        { path: "levelId", select: "name" },
        { path: "lineManager" },
        { path: "reliever" },
      ],
      // excludeById: employeeId || null,
    });

    // const stats = await Employee.getEmployeeStats();

    return ApiSuccess.ok("Employees Retrieved Successfully", {
      employees,
      pagination,
      // stats,
    });
  }

  async updateEmployee(
    employeeId: string,
    clientId: string,
    profileData: Partial<IEmployee>,
    files?: { file?: UploadedFile; avatar?: UploadedFile }
  ) {
    const { file, avatar } = files || {};

    let fileData: any = null;
    let avatarUrl: string | null = null;

    if (file) {
      const fileUrl = await uploadService.uploadToCloudinary(file.tempFilePath);
      const fileType = file.mimetype.startsWith("image/")
        ? "image"
        : "document";
      fileData = { url: fileUrl, fileType };
    }

    if (avatar) {
      const response = await uploadService.uploadToCloudinary(
        avatar.tempFilePath
      );

      avatarUrl = response?.secure_url || "";
    }

    const updatePayload: any = { ...profileData };
    if (fileData) updatePayload.$push = { documents: fileData };
    if (avatarUrl) updatePayload.avatar = avatarUrl;

    const employee = await Employee.findOneAndUpdate(
      { _id: employeeId, clientId },
      updatePayload,
      { new: true, runValidators: true }
    ).populate(["lineManager", "reliever", "clientId"]);

    if (!employee) throw ApiError.badRequest("Employee not found");

    // const leaveBalances = await employee.getLeaveBalances(employeeId, clientId);

    return ApiSuccess.ok("Profile Updated Successfully", {
      employee,
      // leaveBalances,
    });
  }

  async deleteEmployee(employeeId: string, clientId: string) {
    const employee = await Employee.findOneAndDelete({
      _id: employeeId,
      clientId,
    });
    if (!employee) throw ApiError.notFound("Employee not found");

    await LeaveBalance.deleteMany({ employeeId, clientId });
    await Leave.updateMany({ employeeId }, { $set: { employeeId: null } });
    await Employee.updateMany(
      { lineManager: employeeId },
      { $set: { lineManager: null } }
    );
    await Employee.updateMany(
      { reliever: employeeId },
      { $set: { reliever: null } }
    );

    return ApiSuccess.ok("Employee deleted successfully");
  }

  // ---------------- Line Managers ----------------

  async addLineManager(payload: any, clientId: string) {
    const { email, firstname, middlename, surname, accountType } = payload;

    const employee = await Employee.findOne({ email, clientId });
    if (employee) {
      throw ApiError.conflict("Employee with this email already exists");
    }

    const { data } = await clientService.getClient(clientId);
    const client = data?.client;

    const plainPassword = crypto.randomBytes(8).toString("hex"); // 8 characters
    const hashedPassword = await hashPassword(plainPassword);

    // Create a new employee
    const newEmployee = new Employee({
      email,
      firstname,
      middlename: middlename ? middlename : "",
      surname,
      accountType,
      clientId,
      password: hashedPassword,
      isEmailVerified: true,
    });

    const inviteUrl = `${process.env.FRONTEND_URL}/login`;
    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: email,
      subject: `Invite to ${client.name} Leave Board`,
      text: `Hello, you have been invited to join ${client.name} leave board. Your temporary password is: ${plainPassword}. Click on the following link to login to your account: ${inviteUrl}`,
      html: `
      <p>Hi, ${newEmployee.firstname}</p>
      <p>You have been invited to join <strong>${client.name}</strong> leave board.</p>
      <p>Your temporary password is: <strong>${plainPassword}</strong></p>
      <p>Click on the following link to login in</p>
      <a href="${inviteUrl}">Go To Leave Board</a>
    `,
    };

    try {
      await mailService.sendEmail(mailOptions);
      await newEmployee.save();
      return ApiSuccess.ok(`Line Manager added successfully`);
    } catch (error) {
      console.log(error);
      return ApiError.internalServerError(`Error adding ${email}`);
    }
  }

  async deleteLineManager(employeeId: string, clientId: string) {
    // 1. Find the employee
    const employee = await Employee.findOne({ _id: employeeId, clientId });
    if (!employee) {
      throw ApiError.notFound("Employee not found");
    }

    // 2. Remove the employee as lineManager or reliever from other employees
    await Employee.updateMany(
      { lineManager: employeeId, clientId },
      { $unset: { lineManager: "" } }
    );

    await Employee.updateMany(
      { reliever: employeeId, clientId },
      { $unset: { reliever: "" } }
    );

    // 3. Finally delete the employee
    await Employee.deleteOne({ _id: employeeId, clientId });

    return ApiSuccess.ok(
      "Employee deleted successfully and removed as Line Manager/Reliever from others"
    );
  }

  // ---------------- PASSWORDS ----------------
  async forgotPassword(email: string) {
    const employee = await Employee.findOne({ email }).populate("clientId");
    if (!employee) throw ApiError.badRequest("No user with this email");

    const token = generateToken({ email });
    await otpService.createOtp({ email, token });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await mailService.sendForgotPasswordEmail({
      email,
      resetUrl,
      name: employee.name || "User",
      color: employee.clientId.color,
      clientName: employee.clientId.name,
      logo: employee.clientId.logo,
    });

    return ApiSuccess.ok("Password reset email sent");
  }

  async resetPassword(token: string, newPassword: string) {
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      throw ApiError.badRequest("Invalid or expired link");
    }

    console.log({ token, newPassword });

    const passwordReset = await otpService.getOTP({
      email: decoded.email as string,
      token,
    });
    if (!passwordReset) throw ApiError.badRequest("Invalid or expired link");

    const employee = await Employee.findOne({ email: decoded.email }).select(
      "+password"
    );
    if (!employee) throw ApiError.notFound("User not found");

    employee.password = await hashPassword(newPassword);
    await employee.save();
    await otpService.deleteOtp({ token });

    return ApiSuccess.ok("Password has been reset successfully");
  }

  // ---------------- HELPERS ----------------
  private async sendInviteEmail(
    email: string,
    password: string,
    clientName: string,
    inviteUrl: string,
    token: string
  ) {
    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: email,
      subject: `Invite to ${clientName} Leave Board`,
      html: `
        <p>Hello,</p>
        <p>You have been invited to join <strong>${clientName}</strong> leave board.</p>
        <p>Your temporary password is: <strong>${password}</strong></p>
        <p>Click the link below to complete your registration:</p>
        <a href="${inviteUrl}">Go To Leave Board</a>
      `,
    };

    try {
      await mailService.sendEmail(mailOptions);
      await Link.findOneAndUpdate({ token }, { isDelivered: true });
    } catch {
      await Link.findOneAndUpdate({ token }, { isDelivered: false });
    }
  }
}

export const employeeService = new EmployeeService();
