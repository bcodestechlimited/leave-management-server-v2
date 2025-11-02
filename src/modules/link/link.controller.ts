import type { Request, Response } from "express";
import { linkService } from "./link.service";

export class LinkController {
  // ============================
  // Link
  // ============================

  async getAllLinks(req: Request, res: Response) {
    const { clientId } = req.client;
    const query = req.query;
    const result = await linkService.getAllLinks(clientId, query);
    res.status(200).json(result);
  }
}

export const linkController = new LinkController();
