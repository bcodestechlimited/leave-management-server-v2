// jobs/expire-links.job.ts
import Link from "@/modules/link/link.model";
import type Agenda from "agenda";

export default (agenda: Agenda) => {
  agenda.define("expire-links", { concurrency: 1 }, async () => {
    const now = new Date();

    const result = await Link.updateMany(
      {
        status: "pending", // ✅ ONLY pending
        expiresAt: { $lt: now }, // ✅ past expiry
      },
      {
        $set: { status: "expired" },
      },
    );

    console.log(`Expired ${result.modifiedCount} pending links`);
  });
};
