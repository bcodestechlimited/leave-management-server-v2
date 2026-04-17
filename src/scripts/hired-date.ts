import mongoose from "mongoose";
import * as XLSX from "xlsx";
import connectDB from "@/config/connectDB";
import Employee from "@/modules/employee/employee.model";

import path from "path";
import { hashPassword } from "@/utils/validationUtils";

const FILE_PATH = path.resolve(__dirname, "../data/hired-date.xlsx");

const CLIENT_ID = "6800a6704cc8c7225a28c870";

function generatePassword(length = 10) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

async function run() {
  await connectDB();

  const workbook = XLSX.readFile(FILE_PATH, { cellDates: true });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    console.error("No sheet found in the Excel file.");
    process.exit(1);
  }

  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    console.error("Sheet not found in the Excel file.");
    process.exit(1);
  }

  const data: any[] = XLSX.utils.sheet_to_json(sheet);

  console.log({ data: data[0] });

  let updatedCount = 0;
  let newEmployeesCount = 0;
  let notFound: string[] = [];

  for (const [index, row] of data.entries()) {
    const currentRow = index + 1;

    // console.log(`\n➡️ Processing row ${currentRow} of ${data.length}`);

    try {
      const emailRaw = row["EMAIL 1"];
      const hireDateRaw = row["HIRE DATE (DD-MM-YYYY)"];

      if (!emailRaw || !hireDateRaw) {
        console.log(`⚠️ Skipping row ${currentRow} (missing data)`);
        continue;
      }

      const email = String(emailRaw).trim().toLowerCase();

      let employmentStartDate: Date;

      if (hireDateRaw instanceof Date) {
        employmentStartDate = hireDateRaw;
      } else {
        employmentStartDate = new Date(hireDateRaw);
      }

      if (isNaN(employmentStartDate.getTime())) {
        console.log(`❌ Invalid date for ${email}:`, hireDateRaw);
        continue;
      }

      let employee = await Employee.findOne({ email });

      if (!employee) {
        console.log(`🆕 Creating new employee for ${email}`);

        const staff_id = row["STAFF ID"] || "";
        const firstname = row["First Name"] || "";
        const middlename = row["MIDDLE NAME"] || "";
        const surname = row["SURNAME"] || "";
        const role = row["ROLE"] || "";

        const password = generatePassword();

        const hashedPassword = await hashPassword(password);

        employee = await Employee.create({
          clientId: CLIENT_ID,
          staffId: staff_id,
          email,
          password: hashedPassword,
          firstname,
          middlename,
          surname,
          name: `${firstname} ${surname}`,
          jobRole: role,
          employmentStartDate,
          isActive: true,
          isEmailVerified: true,
        });

        console.log(`✅ Created employee: ${email}`);
        newEmployeesCount++;
      } else {
        employee.employmentStartDate = employmentStartDate;
        await employee.save();

        console.log(
          `✅ Updated ${email} → ${employmentStartDate.toISOString()}`,
        );
      }

      updatedCount++;

      console.log(`📊 Progress: ${updatedCount}/${data.length}`);
    } catch (err) {
      console.error(`🔥 Error at row ${currentRow}:`, err);
    }
  }
  console.log("\n🎯 BULK UPDATE SUMMARY");
  console.log(`✅ Updated Employees: ${updatedCount}`);
  console.log(`❌ Not Found: ${notFound.length}`);
  console.log(`📌 Not found emails: ${notFound} `);
  console.log(`🆕 New Employees: ${newEmployeesCount}`);

  if (notFound.length) {
    console.log("\n📌 Emails Not Found:");
    console.log(notFound);
  }

  await mongoose.disconnect();
  console.log("🔌 Disconnected from DB");
}

run();
