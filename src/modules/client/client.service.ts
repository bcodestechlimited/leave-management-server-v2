import { ApiError, ApiSuccess } from "@/utils/responseHandler";
import type { Types } from "mongoose";
import Client from "./client.model";
import crypto from "crypto";
import { comparePassword, hashPassword } from "@/utils/validationUtils";
import { uploadService } from "@/services/upload.service";
import { mailService } from "@/services/mail.service";
import { generateToken, verifyToken } from "@/config/token";
import { otpService } from "../otp/otp.service";
import type { UploadedFile } from "express-fileupload";

class ClientService {
  async getClientById(clientId: Types.ObjectId | string) {
    if (!clientId) {
      throw ApiError.badRequest("Client ID not provided");
    }
    const client = await Client.findById(clientId);
    if (!client) {
      throw ApiError.badRequest("No client with the client ID provided");
    }
    return client;
  }

  async addNewClient(
    clientData: { name: string; color: string; email: string },
    files: { logo: UploadedFile }
  ) {
    const { name, color, email } = clientData;
    const { logo } = files;

    // Check if a client with the same name already exists
    const existingClient = await Client.findOne({ name });
    if (existingClient) {
      throw ApiError.badRequest("A client with this name already exists.");
    }

    const plainPassword = crypto.randomBytes(6).toString("hex");
    const hashedPassword = await hashPassword(plainPassword);

    let logoImageURL;

    const uploadedResponse = await uploadService.uploadToCloudinary(
      logo.tempFilePath
    );

    if (!uploadedResponse?.secure_url) {
      throw ApiError.internalServerError("Failed to upload client logo");
    }

    // Create a new client
    const client = new Client({
      name,
      logo: uploadedResponse.secure_url,
      color,
      email,
      password: hashedPassword,
    });
    await client.save();

    let message;
    let emailInfo;

    try {
      emailInfo = await mailService.sendOnboardingEmailToClient({
        // Edit Later
        // clientId: client._id,
        clientId: client._id as string,
        email,
        plainPassword,
        loginUrl: `${process.env.FRONTEND_URL}/client/login`,
      });
    } catch {
      console.log("There was an error sending an email");
    }

    if (!emailInfo) {
      message = `Client added successfully but email not delivered`;
    } else {
      message = `Client added successfully, credentials sent to ${emailInfo.envelope.to}`;
    }

    return ApiSuccess.created(message);
  }

  async getClients(query = {}) {
    const clients = await Client.find({});
    return ApiSuccess.created("Clients retrieved successfully", { clients });
  }

  async getClient(clientId: Types.ObjectId | string | undefined) {
    if (!clientId) {
      throw ApiError.badRequest("Client ID not provided");
    }
    const client = await this.getClientById(clientId);
    return ApiSuccess.created("Client retrieved successfully", { client });
  }

  async updateClientProfile(
    clientId: Types.ObjectId | string,
    profileData: any,
    files: { logo?: UploadedFile }
  ) {
    const { logo } = files;

    let logoURL;

    if (logo) {
      const imgUrl = await uploadService.uploadToCloudinary(logo.tempFilePath);
      logoURL = imgUrl;
    }

    const updatePayload = { ...profileData };
    updatePayload.logo = logoURL;

    const client = await Client.findOneAndUpdate(
      {
        _id: clientId,
      },
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!client) {
      throw ApiError.badRequest("No user with this email or password");
    }

    return ApiSuccess.ok("Profile Updated Successfully", {
      client,
    });
  }

  async clientLogin(clientData: any) {
    const { email, password } = clientData;
    const client = await Client.findOne({ email }).select("+password");

    if (!client) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    await comparePassword(password, client.password as string);

    const token = generateToken({
      clientId: client._id,
      roles: ["client-admin"],
    });

    client.password = undefined;
    return ApiSuccess.created("Login successful", {
      client,
      token,
    });
  }

  async forgotPassword(email: string) {
    const client = await Client.findOne({ email });
    if (!client) {
      throw ApiError.badRequest("No user with this email");
    }

    const token = generateToken({ email });

    await otpService.createOtp({ email, token });

    const resetUrl = `${process.env.FRONTEND_URL}/client/reset-password?token=${token}`;

    const options = {
      email: client.email,
      resetUrl,
      name: client.name,
      color: client.color,
      clientName: client.name,
      logo: client.logo,
    };

    try {
      await mailService.sendForgotPasswordEmail(options);
      return ApiSuccess.ok("Password reset email sent");
    } catch (error) {
      throw ApiError.internalServerError("Error sending reset email");
    }
  }

  async resetPassword(token: string, newPassword: string) {
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      throw ApiError.badRequest("Invalid or expired link");
    }

    if (!decoded.email) {
      throw ApiError.badRequest("Invalid or expired link");
    }

    const passwordReset = await otpService.getOTP({
      email: decoded.email,
      token,
    });

    if (!passwordReset) {
      throw ApiError.badRequest("Invalid or expired link");
    }

    const client = await Client.findOne({ email: decoded.email }).select(
      "+password"
    );

    if (!client) {
      throw ApiError.notFound("User not found");
    }

    const hashedPassword = await hashPassword(newPassword);
    client.password = hashedPassword;
    await client.save();

    await otpService.deleteOtp({ token });

    return ApiSuccess.ok("Password has been reset successfully");
  }
}

export const clientService = new ClientService();
