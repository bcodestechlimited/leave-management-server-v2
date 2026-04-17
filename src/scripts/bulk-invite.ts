import * as XLSX from "xlsx";
import mongoose from "mongoose";
import { employeeService } from "@/modules/employee/employee.service";
import { env } from "@/config/env.config";
import logger from "@/utils/logger";
import Employee from "@/modules/employee/employee.model";
import { clientService } from "@/modules/client/client.service";
import connectDB from "@/config/connectDB";

const MONGO_URI = env.MONGODB_URI as string;
const CLIENT_ID = "6800a6704cc8c7225a28c870";

type IRow = {
  __rowNum__: number;
  "SC and Emails": string;
};

const extractEmail = (value: string) => {
  const match = value.match(/<([^>]+)>/);
  return match ? match[1]?.trim().toLowerCase() : null;
};

const extractName = (value: string) => {
  const namePart = value.split("<")[0]?.trim(); // "Abass Yusuf"
  const parts = namePart?.split(" ");

  if (!parts) {
    return {
      firstname: "",
      surname: "",
    };
  }

  return {
    firstname: parts[0],
    surname: parts.slice(1).join(" ") || "",
  };
};

async function run() {
  try {
    await connectDB();

    const client = await clientService.getClientById(CLIENT_ID);

    if (!client) {
      throw new Error("Client not found");
    }

    // Read Excel file
    const workbook = XLSX.readFile("src/data/employees.xlsx");
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName || ""];

    if (!sheet) {
      throw new Error("Sheet not found");
    }

    const data: IRow[] = XLSX.utils.sheet_to_json(sheet);

    logger.info(`Processing ${data.length} records...`);

    if (data.length === 0) {
      console.log("No data found in the Excel file.");
      process.exit(0);
    }

    for (const row of data) {
      const raw = row["SC and Emails"];

      const email = extractEmail(raw);

      if (!email) {
        console.log(`❌ Invalid email format: ${raw}`);
        continue;
      }

      const { firstname, surname } = extractName(raw);

      const employee = await Employee.findOne({
        email: email,
        clientId: CLIENT_ID,
      });

      if (employee) {
        logger.info(`Skipping existing user: ${email}`);
        continue;
      }

      if (row.__rowNum__ == 4) {
        continue;
      }

      const payload = {
        firstname: firstname,
        middlename: "",
        surname: surname,
        email: email?.replace(/,/g, "").toLowerCase(),
        accountType: "lineManager",
      };

      try {
        await employeeService.addLineManager(payload, CLIENT_ID);
        console.log(`✅ Invited: ${email}`);
      } catch (err: any) {
        console.log(err);

        console.log(`❌ Failed: ${email} - ${err.message}`);
      }
    }

    console.log("Done processing all records");
    process.exit(0);
  } catch (error) {
    console.error("Script failed:", error);
    process.exit(1);
  }
}

run();
