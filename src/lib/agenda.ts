import { Agenda } from "agenda";
import { env } from "../config/env.config";


function addDbToUri(uri: string, dbName: string): string {
  const [base, query = ""] = uri.split("?"); // 1️⃣ split once
  const trimmedBase = base?.replace(/\/$/, ""); // 2️⃣ drop trailing “/” if present
  return `${trimmedBase}/${dbName}${query ? "?" + query : ""}`; // 3️⃣ glue it back
}

const agenda = new Agenda({
  db: {
    address: addDbToUri(
      env.MONGODB_URI,
      env.NODE_ENV === "production" ? "Haven-Lease" : "Haven-Lease-Staging"
    ),
    collection: "agendaJobs",
  },
  processEvery: "5 seconds",
});

// // Jobs

// agenda.define("send_booking_request_to_landlord", sendBookingRequestToLandlord);


export const startAgenda = async () => {
  await agenda.start();
  console.log("✅ Agenda started");

  // Log all jobs to check if it's running
  const jobs = await agenda.jobs({});
  console.log(`📋 Found ${jobs.length} jobs:`);
  // jobs.forEach(async (job: Job, i) => {
  //   console.log(
  //     `[${i + 1}] ${job.attrs.name} | nextRunAt: ${job.attrs.nextRunAt}`
  //   );
  //   if (job.attrs.nextRunAt && job.attrs.nextRunAt < new Date()) {
  //     console.log(`🔄 Running overdue job: ${job.attrs.name}`);
  //     await job.run();
  //   }
  // });
};

export default agenda;
