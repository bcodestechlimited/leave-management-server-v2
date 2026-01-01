import { env } from "@/config/env.config";
import LeaveBalance from "@/modules/leave-balance/leave-balance.model";
import mongoose from "mongoose";

async function resetLeaveBalances() {
  await mongoose.connect(env.MONGODB_URI, {
    // dbName: "LeaveMS-Stagging",
    dbName: "LeaveMS-Live-v2",
  });

  const balances = await LeaveBalance.aggregate([
    {
      $lookup: {
        from: "leavetypes", // MongoDB collection name (lowercase plural)
        localField: "leaveTypeId",
        foreignField: "_id",
        as: "leaveType",
      },
    },
    { $unwind: "$leaveType" },
    {
      $project: {
        _id: 1,
        defaultBalance: "$leaveType.defaultBalance",
      },
    },
  ]);

  if (!balances.length) {
    console.log("⚠️ No leave balances found");
    process.exit(0);
  }

  const bulkOps = balances.map((b) => ({
    updateOne: {
      filter: { _id: b._id },
      update: { $set: { balance: b.defaultBalance } },
    },
  }));

  await LeaveBalance.bulkWrite(bulkOps);

  console.log("✅ All leave balances reset successfully");
  process.exit(0);
}

resetLeaveBalances();
