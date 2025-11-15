import type { Request, Response } from "express";
import type { UploadedFile } from "express-fileupload";
import { leaveService } from "./leave.service";

export class LeaveController {
  // ============================
  // Leave Requests
  // ============================

  async leaveRequest(req: Request, res: Response) {
    const leaveRequestData = req.body;
    const { clientId } = req.client;
    const { employeeId } = req.employee; // Employee making the request
    const { document } = (req.files as { document?: UploadedFile }) || {};
    const result = await leaveService.requestLeave(
      leaveRequestData,
      employeeId,
      clientId,
      document
    );
    res.status(201).json(result);
  }

  async getLeaveRequests(req: Request, res: Response) {
    const { clientId } = req.client;
    const query = req.query;
    const result = await leaveService.getLeaveRequests(clientId, query);
    res.status(200).json(result);
  }

  async getEmployeeLeaveRequests(req: Request, res: Response) {
    const { clientId } = req.client;
    const query = req.query;
    const { employeeId } = req.employee;
    const result = await leaveService.getLeaveRequests(clientId, query, {
      employeeId,
    });
    res.status(200).json(result);
  }

  async getManagerLeaveRequests(req: Request, res: Response) {
    const { clientId } = req.client;
    const query = req.query;
    const { employeeId } = req.employee;

    const result = await leaveService.getLeaveRequests(clientId, query, {
      lineManager: employeeId,
    });
    res.status(200).json(result);
  }

  async getSingleLeaveRequest(req: Request, res: Response) {
    const { clientId } = req.client;
    const { leaveRequestId } = req.params;
    const result = await leaveService.getSingleLeaveRequest(
      leaveRequestId as string,
      clientId
    );
    res.status(200).json(result);
  }

  async updateLeaveRequest(req: Request, res: Response) {
    const { clientId } = req.client;
    const leaveRequestData = req.body;
    const { leaveRequestId } = req.params;
    const { employeeId } = req.employee;
    const result = await leaveService.updateLeaveRequest(
      leaveRequestId as string,
      leaveRequestData,
      employeeId,
      clientId
    );
    res.status(200).json(result);
  }
  async updateLeaveRequestByClientAdmin(req: Request, res: Response) {
    const { clientId } = req.client;
    const leaveRequestData = req.body;
    const { leaveRequestId } = req.params;
    // const { employeeId } = req.employee;
    const result = await leaveService.updateLeaveRequestByClientAdmin(
      leaveRequestId as string,
      leaveRequestData,
      clientId
    );
    res.status(200).json(result);
  }
  async updateLeaveRequestBySuperAdmin(req: Request, res: Response) {
    const { clientId } = req.client;
    const leaveRequestData = req.body;
    const { leaveRequestId } = req.params;
    // const { employeeId } = req.employee;
    const result = await leaveService.updateLeaveRequestBySuperAdmin(
      leaveRequestId as string,
      leaveRequestData,
      clientId
    );
    res.status(200).json(result);
  }

  async deleteLeaveRequest(req: Request, res: Response) {
    const { clientId } = req.client;
    const { leaveRequestId } = req.params;
    const result = await leaveService.deleteLeaveRequest(
      leaveRequestId as string,
      clientId
    );
    res.status(200).json(result);
  }

  async getLeaveRequestAnalytics(req: Request, res: Response) {
    const { year, clientId } = req.query;
    const result = await leaveService.getLeaveRequestAnalytics(
      clientId as string,
      year as string
    );
    res.status(200).json(result);
  }

  async getMonthlyLeaveRequestReport(req: Request, res: Response) {
    const { clientId } = req.client;
    const query = req.query as { startDate: string; endDate: string };
    const result = await leaveService.getMonthlyLeaveReport(clientId, query);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=leave-report.pdf"
    );
    res.send(result);
  }
}

export const leaveController = new LeaveController();
