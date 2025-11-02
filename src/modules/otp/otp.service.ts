import { ApiError, ApiSuccess } from "@/utils/responseHandler";
import OTP from "./otp.model";

class OtpService {
  async createOtp(otpData: { email: string; otp?: string; token?: string }) {
    const { email, otp, token } = otpData;
    const newOtp = OTP.create({ email, otp, token });
    return newOtp;
  }
  async getOTP(otpData: { email: string; otp?: string; token?: string }) {
    const { email, otp, token } = otpData;

    const searchQuery: Record<string, any> = { email };

    if (otp) {
      searchQuery.otp = otp;
    }
    if (token) {
      searchQuery.token = token;
    }

    const foundOtp = await OTP.findOne(searchQuery);

    if (!foundOtp) {
      throw ApiError.badRequest("Invalid or Expired Token");
    }
    return foundOtp;
  }

  async deleteOtp(otpData: {
    email?: string;
    otp?: string;
    token?: string;
  }): Promise<void> {
    const { email, otp, token } = otpData;

    // Build $or query dynamically
    const orConditions = [];

    if (email) orConditions.push({ email });
    if (otp) orConditions.push({ otp });
    if (token) orConditions.push({ token });

    if (orConditions.length === 0) {
      throw ApiError.badRequest(
        "At least one search parameter (email, otp, or token) must be provided"
      );
    }

    const searchQuery = { $or: orConditions };

    const foundOtp = await OTP.findOne(searchQuery);

    if (!foundOtp) {
      throw ApiError.notFound("OTP not found");
    }

    await OTP.findOneAndDelete(searchQuery);
  }
}

export const otpService = new OtpService();
