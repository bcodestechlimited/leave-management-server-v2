import type { Request, Response } from "express";
import UserService from "./user.service.js";

export class UserController {
  static async getAllUsers(req: Request, res: Response) {
    const query = req.query;
    const result = await UserService.getAllUsers(query);
    res.status(200).json(result);
  }

  // Controller to get all transactions (admin/reporting)
  static getUserById(req: Request, res: Response) {
    const { userId } = req.params;
    const result = UserService.getUserById(userId as string);
    res.status(200).json(result);
  }
}
