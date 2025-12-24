import Employee from "@/modules/employee/employee.model";
import { hashPassword } from "@/utils/validationUtils";
import connectDB from "@/config/connectDB";

const EMAIL = ""; // 🔁 change this
const NEW_PASSWORD = "pass12345";

async function resetEmployeePassword() {
  try {
    await connectDB();

    const employee = await Employee.findOne({ email: EMAIL }).select(
      "+password"
    );

    if (!employee) {
      console.error("❌ Employee not found");
      process.exit(1);
    }

    const hashedPassword = await hashPassword(NEW_PASSWORD);

    employee.password = hashedPassword;
    await employee.save({ validateBeforeSave: false });

    console.log(`✅ Password reset successful for ${employee.email}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Password reset failed:", error);
    process.exit(1);
  }
}

resetEmployeePassword();
