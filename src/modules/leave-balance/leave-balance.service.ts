import { ApiError, ApiSuccess } from "@/utils/responseHandler";
import Employee from "../employee/employee.model";
import mongoose from "mongoose";
import LeaveBalance from "./leave-balance.model";

class LeaveBalanceService {
  async getLeaveBalance(employeeId: string, clientId: string) {
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw ApiError.badRequest("Invalid employeeId provided.");
    }

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      throw ApiError.badRequest("Invalid clientId provided.");
    }

    const employee = await Employee.findOne({
      _id: employeeId,
      clientId,
    });

    if (!employee) {
      throw ApiError.notFound("Employee not found");
    }

    const leaveBalances = await employee.getLeaveBalances(
      String(employeeId),
      String(clientId)
    );

    const newBalances = LeaveBalance.find({ clientId, employeeId }).populate([
      {
        path: "leaveTypeId",
        select: "name defaultBalance",
      },
    ]);

    // Return empty array if no balances are found
    return ApiSuccess.ok("Leave balance retrieved successfully", {
      leaveBalance: leaveBalances.length > 0 ? leaveBalances : [],
      newBalances,
    });
  }

  async getSingleLeaveBalance(
    clientId: string,
    employeeId: string,
    leaveBalanceId: string
  ) {
    if (!mongoose.Types.ObjectId.isValid(leaveBalanceId)) {
      throw ApiError.badRequest("Invalid leaveBalanceId provided.");
    }

    const leaveBalance = await LeaveBalance.find({
      _id: leaveBalanceId,
      clientId,
      employeeId,
    }).populate([
      {
        path: "leaveTypeId",
        select: "name defaultBalance",
      },
    ]);

    return ApiSuccess.ok("Leave balance retrieved successfully", [
      leaveBalance,
    ]);
  }

  async updateLeaveBalance(
    clientId: string,
    employeeId: string,
    leaveBalanceId: string,
    leaveBalanceData: any
  ) {
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw ApiError.badRequest("Invalid employeeId provided.");
    }

    if (!mongoose.Types.ObjectId.isValid(leaveBalanceId)) {
      throw ApiError.badRequest("Invalid leaveBalanceId provided.");
    }

    const employee = await Employee.findOne({
      _id: employeeId,
      clientId,
    });

    if (!employee) {
      throw ApiError.notFound("Employee not found");
    }

    const leaveBalance = await LeaveBalance.findOne({
      _id: leaveBalanceId,
      clientId,
      employeeId,
    });

    if (!leaveBalance) {
      throw ApiError.notFound("Leave balance not found");
    }

    leaveBalance.balance = leaveBalanceData.balance;
    await leaveBalance.save();

    return ApiSuccess.ok("Leave balance updated successfully", leaveBalance);
  }
}

export const leaveBalanceService = new LeaveBalanceService();
