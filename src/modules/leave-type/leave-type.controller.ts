import type { Request, Response } from "express";
import { leaveTypeService } from "./leave-type.service";

export class LeaveTypeController {
  // ============================
  // Leave Types
  // ============================

  async addLeaveType(req: Request, res: Response) {
    const leaveTypeData = req.body;
    const { clientId } = req.client;
    const result = await leaveTypeService.addLeaveType(leaveTypeData, clientId);
    res.status(201).json(result);
  }

  async getLeaveTypes(req: Request, res: Response) {
    const { clientId } = req.client;
    const query = req.query;
    const result = await leaveTypeService.getLeaveTypes(query, clientId);
    res.status(200).json(result);
  }

  async updateLeaveType(req: Request, res: Response) {
    const { clientId } = req.client;
    const leaveTypeData = req.body;
    const { leaveTypeId } = req.params;
    const result = await leaveTypeService.updateLeaveType(
      leaveTypeId as string,
      leaveTypeData,
      clientId
    );
    res.status(200).json(result);
  }

  async deleteLeaveType(req: Request, res: Response) {
    const { clientId } = req.client;
    const { leaveTypeId } = req.params;
    const result = await leaveTypeService.deleteLeaveType(
      leaveTypeId as string,
      clientId
    );
    res.status(200).json(result);
  }
}

export const leaveTypeController = new LeaveTypeController();
