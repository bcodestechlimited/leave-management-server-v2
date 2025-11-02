import type { Request, Response } from "express";
import type { UploadedFile } from "express-fileupload";
import { employeeService } from "./employee.service";

export class EmployeeController {
  // ============================
  // 🔐 Authentication
  // ============================

  async login(req: Request, res: Response) {
    const employeeData = req.body;
    const result = await employeeService.signIn(employeeData);
    res.status(201).json(result);
  }

  // async signUp(req: Request, res: Response) {
  //   const userData = req.body;
  //   const { clientId } = req.client;
  //   const result = await employeeService.signUpWithInviteLink(
  //     userData,
  //     clientId
  //   );
  //   res.status(201).json(result);
  // }

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    const result = await employeeService.forgotPassword(email);
    res.status(200).json(result);
  }

  async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body;
    const result = await employeeService.resetPassword(token, password);
    res.status(200).json(result);
  }

  // ============================
  // 👥 Employees
  // ============================

  async getEmployees(req: Request, res: Response) {
    const { clientId } = req.client;
    const query = req.query;
    const result = await employeeService.getEmployees(
      clientId as string,
      query
    );
    res.status(200).json(result);
  }

  async getAuthEmployee(req: Request, res: Response) {
    const { clientId } = req.client;
    const { employeeId } = req.employee;
    const result = await employeeService.getEmployee(employeeId, clientId);
    res.status(200).json(result);
  }

  async updateAuthEmployee(req: Request, res: Response) {
    const { clientId } = req.client;
    const { employeeId } = req.employee;
    const { isAdmin, ...profileData } = req.body;
    const files = req.files as Record<string, UploadedFile> | undefined;

    const result = await employeeService.updateEmployee(
      employeeId,
      clientId,
      profileData,
      files ?? {}
    );

    res.status(200).json(result);
  }

  async getEmployee(req: Request, res: Response) {
    const { clientId } = req.client;
    const { employeeId } = req.params;
    const result = await employeeService.getEmployee(
      employeeId as string,
      clientId
    );
    res.status(200).json(result);
  }

  async updateEmployee(req: Request, res: Response) {
    const { clientId } = req.client;
    const { employeeId } = req.params;
    const profileData = req.body;
    const files = req.files as
      | { file?: UploadedFile; avatar?: UploadedFile }
      | undefined;

    const result = await employeeService.updateEmployee(
      employeeId as string,
      clientId,
      profileData,
      files
    );

    res.status(200).json(result);
  }

  async deleteEmployee(req: Request, res: Response) {
    const { clientId } = req.client;
    const { employeeId } = req.params;
    const result = await employeeService.deleteEmployee(
      employeeId as string,
      clientId
    );
    res.status(200).json(result);
  }

  // ============================
  // ✉️ Invites
  // ============================

  async sendInvite(req: Request, res: Response) {
    const inviteData = req.body;
    const { clientId } = req.client;
    const result = await employeeService.sendInviteToEmployee(
      inviteData,
      clientId
    );
    res.status(201).json(result);
  }

  async acceptInvite(req: Request, res: Response) {
    const { clientId } = req.client;
    const { token } = req.query;
    const result = await employeeService.acceptInvite(
      token as string,
      clientId
    );
    res.status(200).json(result);
  }

  // async bulkInvite(req: Request, res: Response) {
  //   const { clientId } = req.client;
  //   const file = (req.files as { file: UploadedFile }).file;
  //   const result = await employeeService.employeeBulkInvite(file, clientId);
  //   res.status(201).json(result);
  // }

  async inviteAndAdd(req: Request, res: Response) {
    const inviteData = req.body;
    const { employeeId } = req.employee;
    const { clientId } = req.client;
    const result = await employeeService.InviteAndAddEmployee(
      inviteData,
      employeeId,
      clientId
    );
    res.status(201).json(result);
  }

  // ============================
  // 🧑‍💼 Line Managers
  // ============================

  async addLineManager(req: Request, res: Response) {
    const body = req.body;
    const { clientId } = req.client;
    const result = await employeeService.addLineManager(body, clientId);
    res.status(201).json(result);
  }

  async deleteLineManager(req: Request, res: Response) {
    const { clientId } = req.client;
    const { employeeId } = req.params;
    const result = await employeeService.deleteLineManager(
      employeeId as string,
      clientId
    );
    res.status(201).json(result);
  }
}

export const employeeController = new EmployeeController();
