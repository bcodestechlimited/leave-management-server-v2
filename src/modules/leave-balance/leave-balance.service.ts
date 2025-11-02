import { ApiError, ApiSuccess } from "@/utils/responseHandler";
import Employee from "../employee/employee.model";
import mongoose, { Types } from "mongoose";
import LeaveBalance from "./leave-balance.model";
import type { IQueryParams } from "@/shared/interfaces/query.interface";

class LeaveBalanceService {
  async getLeaveBalance(
    clientId: string,
    employeeId: string,
    query: IQueryParams
  ) {
    const { search, limit = 10 } = query;

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

    console.log({ limit });

    const leaveBalances = await LeaveBalance.aggregate([
      {
        $match: {
          clientId: new Types.ObjectId(clientId),
          employeeId: new Types.ObjectId(employeeId),
        },
      },
      {
        $lookup: {
          from: "leavetypes",
          localField: "leaveTypeId",
          foreignField: "_id",
          as: "leaveType",
        },
      },
      { $unwind: "$leaveType" },
      ...(search
        ? [{ $match: { "leaveType.name": { $regex: search, $options: "i" } } }]
        : []),
      { $limit: Number(limit) },
      {
        $project: {
          _id: 1,
          balance: 1,
          "leaveType._id": 1,
          "leaveType.name": 1,
          "leaveType.defaultBalance": 1,
        },
      },
    ]);

    // const newBalances = LeaveBalance.find({ clientId, employeeId }).populate([
    //   {
    //     path: "leaveTypeId",
    //     select: "name defaultBalance",
    //   },
    // ]);

    const filteredLeaveBalance = leaveBalances.filter((leaveBalance) => {
      if (
        employee.gender === "female" &&
        leaveBalance.leaveType.name.includes("paternity")
      )
        return false;
      if (
        employee.gender === "male" &&
        leaveBalance.leaveType.name.includes("maternity")
      )
        return false;
      if (leaveBalance.leaveType.name.includes("exam")) return false;

      return true;
    });

    // Return empty array if no balances are found
    return ApiSuccess.ok("Leave balance retrieved successfully", {
      // leaveBalance: leaveBalances.length > 0 ? leaveBalances : [],
      // newBalances,
      leaveBalances: filteredLeaveBalance,
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
