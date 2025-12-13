import { env } from "@/config/env.config";
import LeaveBalance from "@/modules/leave-balance/leave-balance.model";
import LeaveType from "@/modules/leave-type/leave-type.model";
import mongoose from "mongoose";

const isDev = env.NODE_ENV === "development";

async function resetLeaveBalances() {
  await mongoose.connect(env.MONGODB_URI, {
    // dbName: isDev ? "LeaveMS-Stagging" : "LeaveMS-Live-v2",
    dbName: "LeaveMS-Stagging",
  });

  const leaveTypes = await LeaveType.find({ isActive: true }).lean();

  const bulkOps = [];

  for (const leaveType of leaveTypes) {
    bulkOps.push({
      updateMany: {
        filter: { leaveTypeId: leaveType._id },
        update: { $set: { balance: leaveType.defaultBalance } },
      },
    });
  }

  if (bulkOps.length) {
    await LeaveBalance.bulkWrite(bulkOps);
  }

  console.log("✅ All leave balances reset successfully");
  process.exit(0);
}

resetLeaveBalances();
