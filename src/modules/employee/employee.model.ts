import mongoose, { Schema, type CallbackError } from "mongoose";
import type { IEmployee } from "./employee.interface";
import Level from "../level/level.model";
import LeaveBalance from "../leave-balance/leave-balance.model";
import logger from "@/utils/logger";

const employeeSchema: Schema<IEmployee> = new Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    staffId: {
      type: String,
      default: null,
      index: true,
    },
    firstname: {
      type: String,
    },
    middlename: {
      type: String,
    },
    surname: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      lowercase: true,
    },
    accountType: {
      type: String,
      enum: ["employee", "lineManager"],
      default: "employee",
    },
    name: {
      type: String,
    },
    username: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    avatar: {
      type: String,
      default:
        "https://res.cloudinary.com/demmgc49v/image/upload/v1695969739/default-avatar_scnpps.jpg",
    },
    jobRole: {
      type: String,
    },
    branch: {
      type: String,
    },
    documents: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
        url: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
          enum: ["image", "document"],
          required: true,
        },
      },
    ],
    isOnLeave: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lineManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    reliever: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    levelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      default: null,
    },
    atsInfo: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

// ------------------------------------------------------
// Runs Only when level changes
// ------------------------------------------------------
employeeSchema.pre("save", async function (next) {
  if (!this.isModified("levelId") || !this.levelId) return next();

  try {
    await updateLeaveBalances(this);
    next();
  } catch (error: any) {
    console.error("Error in pre-save leave balance update:", error);
    next(error);
  }
});

// ------------------------------------------------------
// Runs Only when level changes through findOneAndUpdate
// ------------------------------------------------------
employeeSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() as mongoose.UpdateQuery<IEmployee> | null;

  if (!update) return next();

  // Handle both direct and $set operations
  const newLevelId = update.levelId || (update.$set && update.$set.levelId);

  if (!newLevelId) return next();

  console.log({ newLevelId });

  try {
    const employee = await this.model.findOne(this.getQuery());

    if (!employee) return next();

    const currentLevelId = employee.levelId?.toString();
    const incomingLevelId = newLevelId?.toString();

    // Only proceed if levelId is actually changing
    if (incomingLevelId && incomingLevelId !== currentLevelId) {
      await updateLeaveBalances(employee, incomingLevelId);
    }

    next();
  } catch (error: any) {
    console.error("Error in pre-findOneAndUpdate leave balance update:", error);
    next(error);
  }
});

async function updateLeaveBalances(
  employee: IEmployee,
  newLevelId = employee.levelId
) {
  console.log({
    levelId: String(employee.levelId),
    newLevelId,
  });

  if (newLevelId === null || String(newLevelId) === String(employee.levelId)) {
    logger.info(
      `No change in levelId for employee, Employee levelId: ${employee.levelId} newLevelId: ${newLevelId} /n Skipping leave balance update.`
    );
    return;
  }

  const newLevel = await Level.findById(newLevelId).populate("leaveTypes");
  if (!newLevel) {
    console.log("No level found for levelId:", newLevelId);
    return;
  }

  const newLevelLeaves = newLevel.leaveTypes || [];

  // Remove old balances for the employee
  await LeaveBalance.deleteMany({ employeeId: employee._id });

  // Insert new leave balances
  const newLeaveBalances = newLevelLeaves.map((leave: any) => ({
    clientId: employee.clientId,
    employeeId: employee._id,
    leaveTypeId: leave._id,
    balance: leave.defaultBalance,
  }));

  console.log(`-------Level Updated-----------`);

  await LeaveBalance.insertMany(newLeaveBalances);
}

const Employee = mongoose.model<IEmployee>("Employee", employeeSchema);

export default Employee;
