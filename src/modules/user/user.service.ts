import type { Types } from "mongoose";
import { ApiError, ApiSuccess } from "../../utils/responseHandler";
import { hashPassword } from "../../utils/validationUtils";
import User from "./user.model";
import type { IQueryParams } from "@/shared/interfaces/query.interface";
import { paginate } from "@/utils/paginate";
import type { IUser, updateUserDTO } from "./user.interface";

class UserService {
  static async createUser(userData: Partial<IUser>): Promise<IUser> {
    const { firstName, lastName, password, email, avatar, roles } = userData;

    const hashedPassword = await hashPassword(password as string);

    console.log({ hashedPassword });

    const user = new User({
      firstName: firstName || "",
      lastName: lastName || "",
      email,
      password: hashedPassword,
      avatar: avatar || undefined,
      roles: roles,
    });

    await user.save();

    return user;
  }
  static async updateUser(
    userId: Types.ObjectId,
    userData: Partial<updateUserDTO>
  ): Promise<IUser> {
    const { document, preferences, ...otherFields } = userData;

    const updatedFields = {
      ...otherFields,
      onboarded: true,
      $addToSet: {
        documents: userData.document,
        preferences: userData.preferences,
      },
    };

    console.log({ updatedFields });

    const user = await User.findOneAndUpdate({ _id: userId }, updatedFields, {
      new: true,
    });

    if (!user) {
      throw ApiError.notFound("User Not Found");
    }

    return user;
  }
  static async findUserByEmail(email: string): Promise<IUser> {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw ApiError.notFound("No user with this email");
    }
    return user;
  }
  static async findUserById(userId: Types.ObjectId | string): Promise<IUser> {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound("User Not Found");
    }

    return user;
  }
  static async checkIfUserExists(email: string): Promise<void> {
    const user = await User.findOne({ email });

    if (user) {
      throw ApiError.badRequest("User with this email exists");
    }
  }

  static async getUserOrNull(email: string): Promise<IUser | null> {
    const user = await User.findOne({ email });
    if (!user) {
      return null;
    }
    return user;
  }

  static async getAllUsers(query: IQueryParams) {
    const { page, limit } = query;
    const filterQuery = {};
    const sort = { createdAt: -1 };
    const populateOptions = [{ path: "user" }];

    const { documents: users, pagination } = await paginate({
      model: User,
      query: filterQuery,
      page,
      limit,
      sort,
      populateOptions,
    });

    return ApiSuccess.ok("Users retrieved successfully", {
      users,
      pagination,
    });
  }

  static async getUserById(userId: string) {
    const user = await this.findUserById(userId);
    return ApiSuccess.ok("User retrieved successfully", { user });
  }
}

export default UserService;
