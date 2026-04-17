import type { Request, Response } from "express";
import { leaveBalanceService } from "./leave-balance.service";

export class LeaveBalanceController {
  // ============================
  // Leave Balance
  // ============================

  async getLeaveBalance(req: Request, res: Response) {
    const { clientId } = req.client;
    const { employeeId } = req.employee; // Employee making the request
    const query = req.query;
    const result = await leaveBalanceService.getLeaveBalance(
      clientId,
      employeeId,
      query,
    );
    res.status(200).json(result);
  }

  async getSingleLeaveBalance(req: Request, res: Response) {
    const { clientId } = req.client;
    const { employeeId, leaveBalanceId } = req.params;
    const result = await leaveBalanceService.getSingleLeaveBalance(
      clientId,
      employeeId as string,
      leaveBalanceId as string,
    );
    res.status(200).json(result);
  }

  async updateLeaveBalance(req: Request, res: Response) {
    const { clientId } = req.client;
    const { employeeId, leaveBalanceId } = req.params;
    const leaveBalanceData = req.body;
    const result = await leaveBalanceService.updateLeaveBalance(
      clientId,
      employeeId as string,
      leaveBalanceId as string,
      leaveBalanceData,
    );
    res.status(200).json(result);
  }

  // ============================
  // Employee Leave Balance (Admin)
  // ============================

  async getEmployeeLeaveBalancesForAdmin(req: Request, res: Response) {
    const { clientId } = req.client;
    const { employeeId } = req.params as { employeeId: string }; // Employee making the request
    const query = req.query;

    console.log({ employeeId });

    const result = await leaveBalanceService.getLeaveBalance(
      clientId,
      employeeId,
      query,
    );
    res.status(200).json(result);
  }
}

export const leaveBalanceController = new LeaveBalanceController();
