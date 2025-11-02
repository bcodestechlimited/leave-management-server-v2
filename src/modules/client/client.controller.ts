import type { Request, Response } from "express";
import type { UploadedFile } from "express-fileupload";
import { clientService } from "./client.service";

export class ClientController {
  // ============================
  // Client Authentication
  // ============================

  async clientLogin(req: Request, res: Response) {
    const clientData = req.body;
    const result = await clientService.clientLogin(clientData);
    res.status(200).json(result);
  }

  async updateClientProfile(req: Request, res: Response) {
    const clientData = req.body;
    const { clientId } = req.user;
    const files = req.files as { logo?: UploadedFile };
    const result = await clientService.updateClientProfile(
      clientId,
      clientData,
      files
    );
    res.status(200).json(result);
  }

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    const result = await clientService.forgotPassword(email);
    res.status(201).json(result);
  }

  async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body;
    const result = await clientService.resetPassword(token, password);
    res.status(201).json(result);
  }

  async getClient(req: Request, res: Response) {
    const { clientId } = req.client;
    const result = await clientService.getClient(clientId);
    res.status(200).json(result);
  }

  // ============================
  // Public Facing
  // ============================
  async getPublcClient(req: Request, res: Response) {
    const clientId = req.params.clientId;
    const result = await clientService.getClient(clientId as string);
    res.status(200).json(result);
  }
}

export const clientController = new ClientController();
