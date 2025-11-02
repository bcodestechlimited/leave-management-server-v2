import { ApiError, ApiSuccess } from "@/utils/responseHandler";
import type { UploadedFile } from "express-fileupload";
import LeaveBalance from "../leave-balance/leave-balance.model";
import LeaveType from "../leave-type/leave-type.model";
import Employee from "../employee/employee.model";
import { uploadService } from "@/services/upload.service";
import Leave from "./leave.model";
import type ILeave from "./leave.interface";
import type { IEmployee } from "../employee/employee.interface";
import frontendURLs from "@/utils/frontendURLs";
import { mailService } from "@/services/mail.service";
import type { IQueryParams } from "@/shared/interfaces/query.interface";
import mongoose, { type PipelineStage } from "mongoose";
import ExcelJS from "exceljs";

class LeaveService {
  async requestLeave(
    leaveData: any,
    employeeId: string,
    clientId: string,
    document: UploadedFile | undefined
  ) {
    const { leaveTypeId, startDate, resumptionDate, duration, reason } =
      leaveData;

    // Validate leave balance
    let leaveBalance = await LeaveBalance.findOne({
      employeeId,
      leaveTypeId,
    });

    if (!leaveBalance) {
      const leaveType = await LeaveType.findById(leaveTypeId);

      if (!leaveType) {
        throw ApiError.badRequest("No leave with the leaveTypeId");
      }

      leaveBalance = await LeaveBalance.create({
        employee: employeeId,
        leaveType: leaveTypeId,
        balance: leaveType.defaultBalance,
        clientId,
      });
    }

    if (!leaveBalance || leaveBalance.balance < duration) {
      throw ApiError.badRequest("Insufficient leave balance.");
    }

    const employee = await Employee.findById(employeeId).populate([
      {
        path: "clientId",
      },
      {
        path: "lineManager",
        select: [
          "name",
          "firstname",
          "middlename",
          "surname",
          "email",
          "isOnLeave",
          "reliever",
        ],
      },
      {
        path: "reliever",
        select: [
          "name",
          "firstname",
          "middlename",
          "surname",
          "email",
          "isOnLeave",
        ],
      },
    ]);

    if (!employee) {
      throw ApiError.badRequest("Employee not found");
    }

    if (!employee.lineManager || employee.lineManager === null) {
      throw ApiError.badRequest("Please update your line manager");
    }

    if (!employee.reliever || employee.reliever === null) {
      throw ApiError.badRequest("Please update your reliever");
    }

    if (employee.isOnLeave) {
      throw ApiError.badRequest("You are already on leave");
    }

    if (employee?.reliever?.isOnLeave) {
      throw ApiError.badRequest("Your reliever is on leave");
    }

    if (employee?.lineManager?.isOnLeave) {
      throw ApiError.badRequest("Your line manager is on leave");
    }

    let lineManagerId = employee.lineManager._id;
    let relieverId = employee.reliever._id;

    let documentUrl = "";

    //Upload image to cloudinary
    if (document) {
      const response = await uploadService.uploadToCloudinary(
        document.tempFilePath
      );
      if (response.secure_url) {
        documentUrl = response.secure_url;
      }
    }

    const pendingLeaveRequest = await Leave.findOne({
      employee: employeeId,
      status: "pending",
    });

    if (pendingLeaveRequest) {
      throw ApiError.badRequest(
        "You already have a pending leave request, please wait for that request to be approved."
      );
    }

    // Create leave request
    const leaveRequest = new Leave({
      clientId,
      employee: employeeId,
      lineManager: lineManagerId,
      reliever: relieverId,
      leaveType: leaveTypeId,
      startDate,
      resumptionDate,
      duration,
      reason,
      document: documentUrl,
      status: "pending",
      leaveSummary: {
        balanceBeforeLeave: leaveBalance.balance,
        balanceAfterLeave: leaveBalance.balance - duration,
        remainingDays: leaveBalance.balance - duration,
      },
    });

    leaveBalance.balance = leaveBalance.balance - duration;
    employee.isOnLeave = true;

    await leaveRequest.save();
    await leaveBalance.save();
    await leaveRequest.populate([
      {
        path: "lineManager",
        select: ["name", "firstname", "middlename", "surname", "email"],
      },
      {
        path: "employee",
        select: ["name", "firstname", "middlename", "surname", "email"],
      },
    ]);

    // Send mail to the line manager
    const emailObject = this.createEmailObject(leaveRequest, employee);

    try {
      await mailService.sendLeaveRequestEmailToLineManager(emailObject);
      await mailService.notifyRelieverOfLeaveRequest(emailObject);
    } catch (error) {
      console.log(error);
    }

    return ApiSuccess.created(
      "Leave request submitted successfully",
      leaveRequest
    );
  }

  async getLeaveRequests(
    clientId: string,
    query: IQueryParams = {},
    meta?: { employeeId?: string; lineManager?: string }
  ) {
    console.log("ggg");
    // Ensure query is not null/undefined before destructuring
    const safeQuery = query || {};

    const {
      page = 1,
      limit = 10,
      search,
      status,
      sort = { createdAt: -1 },
    } = safeQuery;

    // --- Base match (client + optional employee/manager filter) ---
    const baseMatch: Record<string, any> = {
      clientId: new mongoose.Types.ObjectId(clientId),
    };

    if (meta && meta.employeeId) {
      baseMatch.employee = new mongoose.Types.ObjectId(meta.employeeId);
    }

    if (meta && meta.lineManager) {
      baseMatch.lineManager = new mongoose.Types.ObjectId(meta.lineManager);
    }

    if (status && status.toLowerCase() !== "all") {
      baseMatch.status = status;
    }

    // --- Count total before any search ---
    const totalCount = await Leave.countDocuments(baseMatch);

    // --- Build aggregation pipeline ---
    const pipeline: PipelineStage[] = [
      { $match: baseMatch },

      // lookup employee
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },

      // lookup lineManager
      {
        $lookup: {
          from: "employees",
          localField: "lineManager",
          foreignField: "_id",
          as: "lineManager",
        },
      },
      { $unwind: "$lineManager" },
    ];

    let searchTokens: string[] = [];
    if (search) {
      searchTokens = search.split(" ").filter(Boolean); // ["david", "smith"]
    }

    if (searchTokens.length > 0) {
      const tokenRegexConditions = searchTokens.map((token) => ({
        $or: [
          { description: { $regex: token, $options: "i" } },
          { status: { $regex: token, $options: "i" } },
          { "employee.firstname": { $regex: token, $options: "i" } },
          { "employee.middlename": { $regex: token, $options: "i" } },
          { "employee.surname": { $regex: token, $options: "i" } },
          { "lineManager.firstname": { $regex: token, $options: "i" } },
          { "lineManager.middlename": { $regex: token, $options: "i" } },
          { "lineManager.surname": { $regex: token, $options: "i" } },
        ],
      }));

      pipeline.push({
        $match: { $and: tokenRegexConditions },
      });
    }

    // --- Count filtered results ---
    const countPipeline = [...pipeline, { $count: "count" }];
    const countResult = await Leave.aggregate(countPipeline);
    const filteredCount = countResult.length > 0 ? countResult[0].count : 0;

    // --- Sorting & Pagination ---
    pipeline.push({ $sort: sort });
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: Number(limit) || 10 });

    // --- Execute final query ---
    const leaveRequests = await Leave.aggregate(pipeline);

    console.log({ totalCount, filteredCount });

    return ApiSuccess.ok("Leave requests retrieved successfully", {
      leaveRequests,
      pagination: {
        totalCount,
        filteredCount,
        totalPages: Math.ceil(filteredCount / limit),
        page,
        limit,
      },
    });
  }

  async getSingleLeaveRequest(leaveId: string, clientId: string) {
    if (!leaveId) {
      throw ApiError.badRequest("LeaveId not provided.");
    }

    const populateOptions = [
      {
        path: "employee",
      },
      {
        path: "leaveType",
        select: "name",
      },
      {
        path: "lineManager",
      },
    ];

    const leaves = await Leave.findOne({
      _id: leaveId,
      clientId,
    }).populate(populateOptions);

    if (!leaves) {
      throw ApiError.badRequest(
        "No leave request found with the provided leaveId."
      );
    }

    return ApiSuccess.ok("Leave request retrieved successfully", leaves);
  }

  async updateLeaveRequest(
    leaveId: string,
    leaveRequestData: any,
    employeeId: string,
    clientId: string
  ) {
    const { status, reason } = leaveRequestData;

    // Find the leave request
    const leaveRequest = await Leave.findOne({
      _id: leaveId,
      clientId: clientId,
    }).populate([{ path: "employee" }]);

    // Needed for while since reliever is now on the leaveRequest
    if (!leaveRequest?.reliever && leaveRequest?.employee?.reliever) {
      leaveRequest.reliever = leaveRequest?.employee?.reliever;
    }

    if (!leaveRequest) {
      throw ApiError.badRequest(
        "No leave request found with the provided leaveId."
      );
    }

    // Check if the person trying to update the leave request is the lineManager or an HR admin
    const employee = await Employee.findById(employeeId).populate([
      {
        path: "lineManager",
      },
      {
        path: "clientId",
      },
    ]);

    if (!employee) {
      throw ApiError.badRequest("Employee not found");
    }

    if (
      employee._id?.toString() !== leaveRequest.lineManager.toString() &&
      !employee.isAdmin
    ) {
      throw ApiError.badRequest("You can't update this leave request");
    }

    // Update leave request status

    // If rejected, add leave balance back
    if (status === "rejected") {
      leaveRequest.status = status;
      const leaveBalance = await LeaveBalance.findOne({
        employeeId: leaveRequest.employee,
        leaveTypeId: leaveRequest.leaveType,
        clientId: clientId,
      });

      if (!leaveBalance) {
        throw ApiError.badRequest("Leave balance record not found");
      }

      leaveBalance.balance += leaveRequest.duration;
      leaveRequest.rejectionReason = reason;
      leaveRequest.rejectedBy = leaveRequest.lineManager._id as IEmployee;
      await leaveBalance.save();

      try {
        const emailObject = this.createEmailObject(leaveRequest, employee);
        await mailService.sendLeaveRejectionEmailToEmployeeFromLineManager(
          emailObject
        );
      } catch (error) {
        console.error("Failed to send leave rejection email:", error);
      }
    }

    if (status === "approved") {
      leaveRequest.approvalReason = reason;
      leaveRequest.approvedBy = leaveRequest.lineManager._id as IEmployee;
      leaveRequest.approvalCount = leaveRequest.approvalCount
        ? leaveRequest.approvalCount + 1
        : 1;
      // const leaveEmployee = await Employee.findById(leaveRequest.employee._id);
      // leaveEmployee.isOnLeave = true;
      // await leaveEmployee.save();

      try {
        const emailObject = this.createEmailObject(leaveRequest, employee);
        // Send to super admin for final approval
        await mailService.sendLeaveRequestToSuperAdmin(emailObject);
      } catch (error) {
        console.error(
          "Failed to send first approval email to client/super admin:",
          error
        );
      }
    }

    await leaveRequest.save();
    return ApiSuccess.ok(
      "Leave request status updated successfully",
      leaveRequest
    );
  }

  //   =============================
  //   Client Admin
  //   =============================

  async updateLeaveRequestByClientAdmin(
    leaveId: string,
    leaveRequestData: any,
    clientId: string
  ) {
    const { status, reason } = leaveRequestData;

    // Find the leave request
    const leaveRequest = await Leave.findOne({
      _id: leaveId,
      clientId,
    }).populate({ path: "employee" });

    // Needed for  while since reliever is now on the leaveRequest
    if (!leaveRequest?.reliever && leaveRequest?.employee?.reliever) {
      leaveRequest.reliever = leaveRequest?.employee?.reliever;
    }

    if (!leaveRequest) {
      throw ApiError.badRequest(
        "No leave request found with the provided leaveId."
      );
    }

    if (leaveRequest.approvalCount && leaveRequest.approvalCount <= 0) {
      throw ApiError.badRequest(
        "This leave request has not been approved by the employee's line manager yet"
      );
    }

    if (!leaveRequest.reliever || !leaveRequest.employee.reliever) {
      throw ApiError.badRequest(
        "Please inform the employee to re-update their reliever first"
      );
    }

    // Check if the person trying to update the leave request is the lineManager or an HR admin
    const employee = await Employee.findById(leaveRequest.employee).populate([
      {
        path: "lineManager",
      },
      {
        path: "clientId",
      },
    ]);

    if (!employee) {
      throw ApiError.badRequest("Employee not found");
    }

    leaveRequest.status = status;

    // If rejected, add leave balance back
    if (status === "rejected") {
      const leaveBalance = await LeaveBalance.findOne({
        employeeId: leaveRequest.employee,
        leaveTypeId: leaveRequest.leaveType,
        clientId,
      });

      if (!leaveBalance) {
        throw ApiError.badRequest("Leave balance record not found");
      }

      leaveBalance.balance += leaveRequest.duration;
      leaveRequest.rejectionReason = reason;
      leaveRequest.rejectedBy = leaveRequest.lineManager._id as IEmployee;
      await leaveBalance.save();

      try {
        const emailObject = this.createEmailObject(leaveRequest, employee);
        await mailService.sendLeaveRejectionEmailToEmployeeFromAdmin(
          emailObject
        );
      } catch (error) {
        console.error("Failed to send leave rejection email:", error);
      }
    }

    if (status === "approved") {
      leaveRequest.approvalReason = reason;
      leaveRequest.approvedBy = leaveRequest.lineManager._id as IEmployee;
      leaveRequest.approvalCount = leaveRequest.approvalCount
        ? leaveRequest.approvalCount + 1
        : 1;
      // const leaveEmployee = await Employee.findById(leaveRequest.employee._id);
      // leaveEmployee.isOnLeave = true;
      // await leaveEmployee.save();
      const leaveBalance = await LeaveBalance.findOne({
        employeeId: leaveRequest.employee,
        leaveTypeId: leaveRequest.leaveType,
        clientId,
      });

      if (!leaveBalance) {
        throw ApiError.badRequest("Leave balance record not found");
      }

      leaveRequest.remainingDays = leaveBalance.balance;
      leaveRequest.balanceBeforeLeave =
        leaveBalance.balance + leaveRequest.duration;

      try {
        const emailObject = this.createEmailObject(leaveRequest, employee);
        await mailService.sendLeaveApprovalEmailToEmployee(emailObject);
        await mailService.sendLeaveApprovalEmailToLineManager(emailObject);
      } catch (error) {
        console.error(
          "Failed to send second approval email to employee and line manager:",
          error
        );
      }
    }

    await leaveRequest.save();
    return ApiSuccess.ok(
      "Leave request status updated successfully",
      leaveRequest
    );
  }

  //   =============================
  //   Super Admin
  //   =============================

  async getLeaveRequestsBySuperAdmin(query: IQueryParams) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sort = { createdAt: -1 },
      employee,
      lineManager,
      clientId,
    } = query;

    // --- Base match (client + optional employee/manager filter) ---
    const baseMatch: Record<string, any> = {
      clientId: new mongoose.Types.ObjectId(clientId),
    };

    if (employee) {
      baseMatch.employee = new mongoose.Types.ObjectId(employee);
    }

    if (lineManager) {
      baseMatch.lineManager = new mongoose.Types.ObjectId(lineManager);
    }

    if (status && status.toLowerCase() !== "all") {
      baseMatch.status = status;
    }

    // --- Count total before any search ---
    const totalCount = await Leave.countDocuments(baseMatch);

    // --- Build aggregation pipeline ---
    const pipeline: PipelineStage[] = [
      { $match: baseMatch },

      // lookup employee
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },

      // lookup lineManager
      {
        $lookup: {
          from: "employees",
          localField: "lineManager",
          foreignField: "_id",
          as: "lineManager",
        },
      },
      { $unwind: "$lineManager" },
    ];

    let searchTokens: string[] = [];
    if (search) {
      searchTokens = search.split(" ").filter(Boolean); // ["david", "smith"]
    }

    if (searchTokens.length > 0) {
      const tokenRegexConditions = searchTokens.map((token) => ({
        $or: [
          { description: { $regex: token, $options: "i" } },
          { status: { $regex: token, $options: "i" } },
          { "employee.firstname": { $regex: token, $options: "i" } },
          { "employee.middlename": { $regex: token, $options: "i" } },
          { "employee.surname": { $regex: token, $options: "i" } },
          { "lineManager.firstname": { $regex: token, $options: "i" } },
          { "lineManager.middlename": { $regex: token, $options: "i" } },
          { "lineManager.surname": { $regex: token, $options: "i" } },
        ],
      }));

      pipeline.push({
        $match: { $and: tokenRegexConditions },
      });
    }

    // --- Count filtered results ---
    const countPipeline = [...pipeline, { $count: "count" }];
    const countResult = await Leave.aggregate(countPipeline);
    const filteredCount = countResult.length > 0 ? countResult[0].count : 0;

    // --- Sorting & Pagination ---
    pipeline.push({ $sort: sort });
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: Number(limit) || 10 });

    // --- Execute final query ---
    const leaveRequests = await Leave.aggregate(pipeline);

    console.log({ totalCount, filteredCount });

    return ApiSuccess.ok("Leave requests retrieved successfully", {
      leaveRequests,
      pagination: {
        totalCount,
        filteredCount,
        totalPages: Math.ceil(filteredCount / limit),
        page,
        limit,
      },
    });
  }

  async updateLeaveRequestBySuperAdmin(
    leaveId: string,
    leaveRequestData: any,
    clientId: string
  ) {
    const { status, reason } = leaveRequestData;

    // Find the leave request
    const leaveRequest = await Leave.findOne({
      _id: leaveId,
      clientId,
    }).populate({ path: "employee" });

    // Needed for  while since reliever is now on the leaveRequest
    if (!leaveRequest?.reliever && leaveRequest?.employee?.reliever) {
      leaveRequest.reliever = leaveRequest.employee.reliever;
    }

    if (!leaveRequest) {
      throw ApiError.badRequest(
        "No leave request found with the provided leaveId."
      );
    }

    if (leaveRequest?.approvalCount && leaveRequest?.approvalCount <= 0) {
      throw ApiError.badRequest(
        "This leave request has not been approved by the employee's line manager yet"
      );
    }

    // Check if the person trying to update the leave request is the lineManager or an HR admin
    const employee = await Employee.findById(leaveRequest.employee).populate([
      {
        path: "lineManager",
      },
      {
        path: "clientId",
      },
    ]);

    if (!employee) {
      throw ApiError.badRequest("Employee not found");
    }

    leaveRequest.status = status;

    // If rejected, add leave balance back
    if (status === "rejected") {
      const leaveBalance = await LeaveBalance.findOne({
        employeeId: leaveRequest.employee,
        leaveTypeId: leaveRequest.leaveType,
        clientId,
      });

      if (!leaveBalance) {
        throw ApiError.badRequest("No leave balance found for the employee.");
      }

      leaveBalance.balance += leaveRequest.duration;
      leaveRequest.rejectionReason = reason;
      leaveRequest.rejectedBy = leaveRequest.lineManager._id as IEmployee;
      await leaveBalance.save();

      try {
        const emailObject = this.createEmailObject(leaveRequest, employee);
        await mailService.sendLeaveRejectionEmailToEmployeeFromAdmin(
          emailObject
        );
      } catch (error) {
        console.error("Failed to send leave rejection email:", error);
      }
    }

    if (status === "approved") {
      leaveRequest.approvalReason = reason;
      leaveRequest.approvedBy = leaveRequest.lineManager._id as IEmployee;
      leaveRequest.approvalCount = 2;
      // const leaveEmployee = await Employee.findById(leaveRequest.employee._id);
      // leaveEmployee.isOnLeave = true;
      // await leaveEmployee.save();
      const leaveBalance = await LeaveBalance.findOne({
        employeeId: leaveRequest.employee,
        clientId,
      });

      if (!leaveBalance) {
        throw ApiError.badRequest("No leave balance found for the employee.");
      }

      leaveRequest.remainingDays = leaveBalance.balance;
      leaveRequest.balanceBeforeLeave =
        leaveBalance.balance + leaveRequest.duration;

      try {
        const emailObject = this.createEmailObject(leaveRequest, employee);
        await mailService.sendLeaveApprovalEmailToEmployee(emailObject);
        await mailService.sendLeaveApprovalEmailToLineManager(emailObject);
      } catch (error) {
        console.error(
          "Failed to send second approval email employee and line manager:",
          error
        );
      }
    }

    await leaveRequest.save();
    return ApiSuccess.ok(
      "Leave request status updated successfully",
      leaveRequest
    );
  }

  async deleteLeaveRequest(leaveId: string, clientId: string) {
    if (!leaveId) {
      throw ApiError.badRequest("LeaveId not provided.");
    }

    const leaveRequest = await Leave.findOneAndDelete({
      _id: leaveId,
      clientId,
    });

    if (!leaveRequest) {
      throw ApiError.badRequest(
        "No leave request found with the provided leaveId."
      );
    }

    return ApiSuccess.ok("Leave request deleted successfully", leaveRequest);
  }

  //   =============================
  //   Anyalytics
  //   =============================

  async getMonthlyLeaveReport(
    clientId: string,
    query: { startDate: string; endDate: string }
  ) {
    const { startDate, endDate } = query;

    if (!clientId) {
      throw ApiError.badRequest("Client ID not provided.");
    }

    const leaveRequests = await Leave.find({
      clientId,
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      status: { $in: ["approved", "rejected"] },
    })
      .populate([
        {
          path: "employee",
          select: "staffId firstname middlename surname branch jobRole levelId",
          populate: {
            path: "reliever",
            select:
              "staffId firstname middlename surname branch jobRole levelId",
          },
        },
        {
          path: "lineManager",
        },
        {
          path: "reliever",
        },
        {
          path: "leaveType",
        },
      ])
      .sort({ createdAt: -1 });

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monthly Leave Report");

    // Define columns
    worksheet.columns = [
      { header: "S/N", key: "sn", width: 5 },
      { header: "STAFF NO", key: "staffNo", width: 15 },
      { header: "NAME", key: "name", width: 25 },
      { header: "BRANCH", key: "branch", width: 15 },
      { header: "TYPE OF LEAVE", key: "leaveType", width: 20 },
      { header: "DESIGNATION", key: "designation", width: 20 },
      { header: "START DATE", key: "startDate", width: 15 },
      { header: "END DATE", key: "endDate", width: 15 },
      { header: "RESUMPTION DATE", key: "resumptionDate", width: 18 },
      { header: "DURATION", key: "duration", width: 10 },
      { header: "REM DAYS", key: "remDays", width: 10 },
      { header: "RELIEVER", key: "reliever", width: 25 },
      { header: "REJECTION REASON", key: "rejectionReason", width: 25 },
    ];

    // Add rows
    for (const [index, leave] of leaveRequests.entries()) {
      const employee = leave.employee || {};
      const leaveType = leave.leaveType || {};

      const enddate = leave.resumptionDate
        ? new Date(leave.resumptionDate.getTime() - 1000 * 60 * 60 * 24)
            .toISOString()
            .split("T")[0]
        : "";

      let relieverDoc = leave.reliever || employee?.reliever; // prefer leave.reliever, fallback to employee.reliever
      let relieverName = "N/A";

      if (relieverDoc) {
        relieverName = `${relieverDoc.firstname || ""} ${
          relieverDoc.middlename || ""
        } ${relieverDoc.surname || ""}`.trim();
      } else {
        console.log("⚠️ Missing reliever for employee:", {
          employeeId: employee?._id,
          staffId: employee?.staffId,
          name: `${employee?.firstname || ""} ${employee?.surname || ""}`,
          leaveId: leave._id,
        });
      }

      if (employee?.reliever) {
        relieverName = `${employee.reliever.firstname || ""} ${
          employee.reliever.middlename || ""
        } ${employee.reliever.surname || ""}`;
      } else {
        relieverName = "N/A";
        console.log("⚠️ Missing reliever for employee:", {
          employeeId: employee?._id,
          staffId: employee?.staffId,
          name: `${employee?.firstname || ""} ${employee?.surname || ""}`,
          leaveId: leave._id,
        });
      }

      worksheet.addRow({
        sn: index + 1,
        staffNo: employee.staffId || "",
        name: `${employee.firstname || ""} ${employee.middlename || ""} ${
          employee.surname || ""
        }`,
        branch: employee?.branch || "",
        leaveType: leaveType?.name || "",
        designation: employee.jobRole || "",
        startDate: leave.startDate?.toISOString().split("T")[0] || "",
        endDate: enddate,
        resumptionDate: leave.resumptionDate?.toISOString().split("T")[0] || "",
        duration: leave.duration || 0,
        remDays: leave.leaveSummary.remainingDays || 0,
        reliever: relieverName,
      });
    }

    // Return file buffer (for API download or saving to disk)
    const buffer = await workbook.xlsx.writeBuffer();
    console.log({ buffer });
    return buffer;

    return ApiSuccess.ok("Leave balance retrieved successfully");
  }

  async getLeaveRequestAnalytics(clientId: string, year: string) {
    let matchStage: PipelineStage.Match = {
      $match: {
        clientId: new mongoose.Types.ObjectId(clientId),
      },
    };

    if (year) {
      matchStage = {
        $match: {
          clientId: new mongoose.Types.ObjectId(clientId),
          startDate: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lte: new Date(`${year}-12-31T23:59:59.999Z`),
          },
        },
      };
    }

    const leaveData = await Leave.aggregate([
      matchStage,
      {
        $group: {
          _id: { month: { $month: "$startDate" } },
          totalLeaveRequests: { $sum: 1 },
          approvedRequests: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
          rejectedRequests: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
          pendingRequests: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    // Convert month numbers to month names
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const result = monthNames.map((month, index) => {
      const data = leaveData.find((item) => item._id.month === index + 1);
      return {
        month,
        totalLeaveRequests: data?.totalLeaveRequests || 0,
        approvedRequests: data?.approvedRequests || 0,
        rejectedRequests: data?.rejectedRequests || 0,
        pendingRequests: data?.pendingRequests || 0,
      };
    });

    return ApiSuccess.ok("Analytics Retrieved Successfully", {
      analytics: result,
    });
  }

  //   =============================
  //   Email Object Creation
  //   =============================

  private createEmailObject(leave: ILeave, employee: IEmployee) {
    return {
      lineManagerName: employee.lineManager?.firstname as string,
      lineManagerEmail: employee.lineManager?.email as string,
      employeeName: employee?.firstname as string,
      employeeEmail: leave?.employee?.email as string,
      relieverName: employee.reliever?.firstname as string,
      relieverEmail: employee.reliever?.email as string,
      email: leave.lineManager?.email as string,
      clientName: employee.clientId?.name as string,
      clientEmail: employee.clientId?.email as string,
      color: employee.clientId?.color as string,
      logo: employee.clientId?.logo as string,
      startDate: leave.startDate,
      resumptionDate: leave.resumptionDate,
      leaveReason: leave.reason,
      rejectionReason: leave.rejectionReason,
      approvalReason: leave.approvalReason,
      leaveRequestUrl: frontendURLs.employee.leaveDetails(leave._id),
      clientLeaveRequestUrl: frontendURLs.client.leaveDetails(leave._id),
    };
  }
}

export const leaveService = new LeaveService();
