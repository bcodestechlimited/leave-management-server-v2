import { z } from "zod";

class LevelSchemas {
  // 1. Validator for adding a new Level
  addLevel = z
    .object({
      name: z
        .string({ required_error: "Level name is required" })
        .min(1, "Level name cannot be empty"),
    })
    .strict();

  // 2. Validator for updating an existing Level
  updateLevel = z
    .object({
      name: z.string().min(1, "Level name cannot be empty").optional(),
    })
    .strict();
}

export const levelSchemas = new LevelSchemas();
