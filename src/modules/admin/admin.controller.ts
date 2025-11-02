import type { Request, Response } from "express";
import { adminService } from "./admin.service";
import { clientService } from "../client/client.service";
import type { UploadedFile } from "express-fileupload";
import { leaveService } from "../leave/leave.service";

export class AdminController {
  // ============================
  // Admin Controller
  // ============================

  async adminRegister(req: Request, res: Response) {
    const userData = req.body;
    const result = await adminService.adminRegister(userData);
    res.status(201).json(result);
  }
  async adminLogin(req: Request, res: Response) {
    const userData = req.body;
    const result = await adminService.adminLogin(userData);
    res.status(200).json(result);
  }

  async adminLoginAsEmployee(req: Request, res: Response) {
    const userData = req.body;
    const result = await adminService.adminLoginAsEmployee(userData);
    res.status(200).json(result);
  }
  async getAdmin(req: Request, res: Response) {
    const { userId } = req.user;
    const result = await adminService.getAdmin(userId);
    res.status(200).json(result);
  }
  async adminForgotPassword(req: Request, res: Response) {
    const userData = req.body;
    const result = await adminService.adminForgotPassword(userData);
    res.status(200).json(result);
  }

  async adminResetPassword(req: Request, res: Response) {
    const userData = req.body;
    const result = await adminService.adminResetPassword(userData);
    res.status(200).json(result);
  }

  // ============================
  // Client Management
  // ============================

  async addClient(req: Request, res: Response) {
    const clientData = req.body;
    const files = req.files as { logo: UploadedFile };
    const result = await clientService.addNewClient(clientData, files);
    res.status(201).json(result);
  }

  async getClients(req: Request, res: Response) {
    const result = await clientService.getClients();
    res.status(200).json(result);
  }

  async getClient(req: Request, res: Response) {
    const clientId = req.params.clientId;
    const result = await clientService.getClient(clientId);
    res.status(200).json(result);
  }

  // ============================
  // Leave Management
  // ============================

  async getLeaveRequestAnalytics(req: Request, res: Response) {
    const { clientId, year } = req.query;
    const result = await leaveService.getLeaveRequestAnalytics(
      clientId as string,
      year as string
    );
    res.status(200).json(result);
  }
  async getLeaveRequests(req: Request, res: Response) {
    const query = req.query;
    const result = await leaveService.getLeaveRequestsBySuperAdmin(query);
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
    const { clientId } = req.query;
    const leaveRequestData = req.body;
    const { leaveRequestId } = req.params;
    const result = await leaveService.updateLeaveRequestBySuperAdmin(
      leaveRequestId as string,
      leaveRequestData,
      clientId as string
    );
    res.status(200).json(result);
  }
}

export const adminController = new AdminController();
