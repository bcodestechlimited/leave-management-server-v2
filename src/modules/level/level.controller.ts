import type { Request, Response } from "express";
import { levelService } from "./level.service";

export class LevelController {
  // ============================
  // Level
  // ============================

  async addLevel(req: Request, res: Response) {
    const levelData = req.body;
    const { clientId } = req.client;
    const result = await levelService.addLevel(levelData, clientId);
    res.status(201).json(result);
  }

  async getLevels(req: Request, res: Response) {
    const { clientId } = req.client;
    const result = await levelService.getLevels(req.query, clientId);
    res.status(200).json(result);
  }

  async getLevel(req: Request, res: Response) {
    const { clientId } = req.client;
    const { levelId } = req.params;
    const result = await levelService.getLevel(clientId, levelId as string);
    res.status(200).json(result);
  }

  async updateLevel(req: Request, res: Response) {
    const { levelId } = req.params;
    const levelData = req.body;
    const { clientId } = req.client;
    const result = await levelService.updateLevel(
      levelId as string,
      levelData,
      clientId
    );
    res.status(200).json(result);
  }

  async deleteLevel(req: Request, res: Response) {
    const { clientId } = req.client;
    const { levelId } = req.params;
    const result = await levelService.deleteLevel(clientId, levelId as string);
    res.status(200).json(result);
  }
}

export const levelController = new LevelController();
