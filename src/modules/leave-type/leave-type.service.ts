import { ApiError, ApiSuccess } from "@/utils/responseHandler";
import { paginate } from "@/utils/paginate";
import { levelService } from "../level/level.service";
import LeaveType from "./leave-type.model";
import LeaveBalance from "../leave-balance/leave-balance.model";
import type { IQueryParams } from "@/shared/interfaces/query.interface";
import agendaInstance from "@/lib/agenda";
import Employee from "../employee/employee.model";

class LeaveTypeService {
  // async addLeaveType(leaveTypeData: any, clientId: string) {
  //   const { name, defaultBalance, levelId } = leaveTypeData;

  //   // Check if the leave type already exists in the level by name using aggregation
  //   // Use lean() for faster queries, returning plain objects
  //   const levelWithLeaveType = await levelService.getLevelById(
  //     levelId,
  //     clientId,
  //     true,
  //     [{ path: "leaveTypes", select: "name" }]
  //   );

  //   // Check if the leave type name already exists in the level's leaveTypes array
  //   const leaveTypeExistsInLevel = levelWithLeaveType.leaveTypes.some(
  //     (leaveType) => leaveType.name === name.toLowerCase()
  //   );

  //   if (leaveTypeExistsInLevel) {
  //     throw ApiError.badRequest(
  //       "A leave type with this name already exists in this level."
  //     );
  //   }

  //   // Create a new leave type
  //   const leaveType = new LeaveType({
  //     name,
  //     defaultBalance,
  //     clientId,
  //     levelId,
  //   });
  //   await leaveType.save();

  //   // Atomically update the level with the new leave type, using $push for atomicity
  //   await levelService.updateLevel(
  //     levelId,
  //     {
  //       $push: { leaveTypes: leaveType },
  //     },
  //     clientId
  //   );

  //   // Find all employees under this level
  //   const employees = await Employee.find({
  //     levelId,
  //     clientId,
  //     accountType: "employee",
  //   }).lean();

  //   // Add the leave type with the default balance to all employees in EmployeeLeaveBalance
  //   const employeeLeaveBalances = employees.map((employee) => ({
  //     clientId,
  //     employeeId: employee._id,
  //     leaveTypeId: leaveType._id,
  //     balance: defaultBalance,
  //   }));

  //   console.log({ employeeLeaveBalances });

  //   // Use bulk insert to add leave balances for all employees
  //   await LeaveBalance.insertMany(employeeLeaveBalances);

  //   return ApiSuccess.created("Leave type added successfully", leaveType);
  // }

  async addLeaveType(leaveTypeData: any, clientId: string) {
    const { name, defaultBalance, levelId } = leaveTypeData;

    // Check if leave type already exists in the level
    const levelWithLeaveType = await levelService.getLevelById(
      levelId,
      clientId,
      true,
      [{ path: "leaveTypes", select: "name" }]
    );

    const leaveTypeExists = levelWithLeaveType.leaveTypes.some(
      (lt) => lt.name === name.toLowerCase()
    );

    if (leaveTypeExists) {
      throw ApiError.badRequest(
        "A leave type with this name already exists in this level."
      );
    }

    // Create leave type
    const leaveType = await LeaveType.create({
      name,
      defaultBalance,
      clientId,
      levelId,
    });

    // Push leave type into level
    await levelService.updateLevel(
      levelId,
      { $push: { leaveTypes: leaveType._id } },
      clientId
    );

    // Queue background job (non-blocking)
    await agendaInstance.now("generate-leave-balances", {
      levelId,
      clientId,
      leaveTypeId: leaveType._id,
      defaultBalance,
    });

    return ApiSuccess.created(
      "Leave type added. Leave balances are being processed in the background.",
      leaveType
    );
  }

  async getLeaveTypes(query: IQueryParams, clientId: string) {
    const { page = 1, limit = 10, search, sort = { createdAt: -1 } } = query;

    const filter: Record<string, any> = { clientId };
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const populateOptions = [
      {
        path: "levelId",
        select: "name",
      },
    ];

    const { documents: leaveTypes, pagination } = await paginate({
      model: LeaveType,
      query: filter,
      page,
      limit,
      populateOptions,
      sort,
    });

    return ApiSuccess.ok("Leave types retrieved successfully", {
      leaveTypes,
      pagination,
    });
  }

  async updateLeaveType(
    leaveTypeId: string,
    leaveTypeData: any,
    clientId: string
  ) {
    if (!leaveTypeId) {
      throw ApiError.badRequest("Leave type id not provided.");
    }

    console.log({ leaveTypeData });

    // Update the leave type
    const leaveType = await LeaveType.findOneAndUpdate(
      { _id: leaveTypeId, clientId },
      { ...leaveTypeData },
      { runValidators: true, new: true }
    );

    if (!leaveType) {
      throw ApiError.badRequest("No leave type found");
    }

    // If the default balance is updated, adjust leave balances for all employees
    if (leaveTypeData.defaultBalance !== undefined) {
      const employeesToUpdate = await LeaveBalance.find({
        leaveTypeId,
        clientId,
      });

      const bulkUpdates = employeesToUpdate.map((balance) => ({
        updateOne: {
          filter: { _id: balance._id },
          update: {
            $set: { balance: leaveTypeData.defaultBalance },
          },
        },
      }));

      // Perform a bulk write for efficiency
      if (bulkUpdates.length) {
        await LeaveBalance.bulkWrite(bulkUpdates);
      }
    }

    return ApiSuccess.ok("Leave type updated successfully", leaveType);
  }

  async deleteLeaveType(leaveTypeId: string, clientId: string) {
    if (!leaveTypeId) {
      throw ApiError.badRequest("LeaveTypeId not provided.");
    }

    // Find and delete the leave type
    const leaveType = await LeaveType.findOneAndDelete({
      _id: leaveTypeId,
      clientId,
    });
    if (!leaveType) {
      throw ApiError.badRequest(
        "No leave type found with the provided leaveTypeId."
      );
    }

    // Remove corresponding leave balances
    await LeaveBalance.deleteMany({ leaveTypeId });

    return ApiSuccess.ok("Leave type deleted successfully", leaveType);
  }
}

export const leaveTypeService = new LeaveTypeService();
