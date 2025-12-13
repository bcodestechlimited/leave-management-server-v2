import Employee from "@/modules/employee/employee.model";
import LeaveBalance from "@/modules/leave-balance/leave-balance.model";
import type Agenda from "agenda";

export default (agenda: Agenda) => {
  agenda.define(
    "generate-leave-balances",
    { concurrency: 3 }, // run up to 3 jobs at a time
    async (job: any) => {
      const { levelId, clientId, leaveTypeId, defaultBalance } = job.attrs.data;

      console.log({ levelId, clientId, leaveTypeId, defaultBalance });

      const CHUNK_SIZE = 1000;

      console.log(`Here`);

      const totalEmployees = await Employee.countDocuments({
        levelId,
        clientId,
      });

      let skip = 0;

      while (skip < totalEmployees) {
        const employees = await Employee.find({ levelId, clientId }, { _id: 1 })
          .skip(skip)
          .limit(CHUNK_SIZE)
          .lean();

        const payload = employees.map((e: any) => ({
          clientId,
          employeeId: e._id,
          leaveTypeId,
          balance: defaultBalance,
        }));

        await LeaveBalance.insertMany(payload, { ordered: false });

        skip += CHUNK_SIZE;

        console.log(`Processed ${skip}/${totalEmployees} employees`);
      }

      console.log("Leave balance generation completed");
    }
  );
};
