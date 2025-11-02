import { ApiError, ApiSuccess } from "@/utils/responseHandler";
import Level from "./level.model";
import { paginate } from "@/utils/paginate";
import type { PopulateOptions } from "mongoose";

class LevelService {
  async getLevelById(
    levelId: string,
    clientId: string,
    useLean = false,
    populate: PopulateOptions[] = []
  ) {
    if (!levelId) {
      throw ApiError.badRequest("LevelId not provided");
    }
    const levelQuery = Level.findOne({ _id: levelId, clientId });
    if (populate.length > 0) {
      levelQuery.populate(populate);
    }
    const level = useLean ? await levelQuery.lean() : await levelQuery;

    if (!level) {
      throw ApiError.badRequest("No level with the levelId provided");
    }

    return level;
  }

  async addLevel(levelData: any, clientId: string) {
    const { name, description } = levelData;

    const existingLevel = await Level.findOne({ name, clientId });

    if (existingLevel) {
      throw ApiError.badRequest("A level with this name already exists.");
    }

    // Create a new level
    const level = new Level({
      name,
      description,
      clientId,
    });
    await level.save();
    return ApiSuccess.created("Level added successfully", level);
  }

  async getLevels(query: any, clientId: string) {
    const { page = 1, limit = 10, search, sort = { createdAt: -1 } } = query;

    const filter: Record<string, any> = { clientId };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const populateOptions = [
      {
        path: "leaveTypes",
      },
    ];

    const { documents: levels, pagination } = await paginate({
      model: Level,
      query: filter,
      page,
      limit,
      sort,
      populateOptions,
    });

    return ApiSuccess.created("Levels retrieved successfully", {
      levels,
      pagination,
    });
  }

  async getLevel(clientId: string, levelId: string) {
    if (!levelId) {
      throw ApiError.badRequest("LevelId not provided");
    }
    const level = await this.getLevelById(levelId, clientId);

    return ApiSuccess.created("Level retrieved successfully", { level });
  }

  async updateLevel(levelId: string, levelData: any, clientId: string) {
    if (!levelId) {
      throw ApiError.badRequest("LevelId not provided");
    }

    const level = await Level.findOneAndUpdate(
      { _id: levelId, clientId },
      { ...levelData },
      { runValidators: true, new: true }
    );

    if (!level) {
      throw ApiError.badRequest("No level found with the provided levelId");
    }
    // await level.save();
    return ApiSuccess.created("Level updated successfully", level);
  }

  async deleteLevel(levelId: string, clientId: string) {
    if (!levelId) {
      throw ApiError.badRequest("LevelId not provided");
    }

    const level = await this.getLevelById(levelId, clientId);

    // Delete the level
    await level.deleteOne();
    return ApiSuccess.created("Level deleted successfully", { level });
  }

  async checkLeaveTypeExistsInLevel(levelId: string, leaveTypeId: string) {
    // Find the level and check if leaveTypeId exists in leaveTypes
    const level = await Level.findOne({
      _id: levelId,
      leaveTypes: leaveTypeId, // Match leaveTypeId in the leaveTypes array
    });

    if (level) {
      return ApiError.badRequest(
        "This leave type already exists in this level"
      );
    }
  }
}

export const levelService = new LevelService();
