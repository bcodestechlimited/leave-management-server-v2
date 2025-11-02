import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OTP from "../modules/otp/otp.model.js";
import generateOTP from "../utils/generateOTP.js";
import transporter from "../lib/transporter.js";
import type { SentMessageInfo, Transporter } from "nodemailer";
import logger from "../utils/logger.js";
import { env } from "@/config/env.config.js";
import { formatDate } from "@/utils/dateUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

class MailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = transporter;
  }

  defaultSender = env.ADMIN_EMAIL || "support@hrcoreapp.com";

  private static loadTemplate(templateName: string, data: object): string {
    const templatePath = path.join(
      __dirname,
      "..",
      "templates",
      `${templateName}.html`
    );

    console.log({ templatePath });

    const templateSource = fs.readFileSync(templatePath, "utf8");
    const compiledTemplate = handlebars.compile(templateSource);
    return compiledTemplate(data);
  }

  async sendEmail({
    from,
    to,
    subject,
    text,
    html,
  }: EmailOptions): Promise<SentMessageInfo> {
    try {
      const senderEmail = from || this.defaultSender;
      const mailOptions = {
        // from: from || defaultSender,
        from: `"HRCore - Leave Board" <${senderEmail}>`,
        to: env.NODE_ENV === "production" ? to : "davidtumuch@gmail.com",
        subject,
        text,
        html,
      };

      const sentMessageInfo = await this.transporter.sendMail(mailOptions);
      return sentMessageInfo;
    } catch (error) {
      logger.fatal("Error sending email:", error);
      throw error;
    }
  }

  async sendOTPViaEmail({
    email,
    userName,
  }: {
    email: string;
    userName: string;
  }): Promise<SentMessageInfo> {
    await OTP.findOneAndDelete({ email });

    const otp = generateOTP();
    await OTP.create({ email, otp });

    const subject = "OTP Request";
    const date = new Date().toLocaleString();
    const emailText = `Hello ${userName},\n\nYour OTP is: ${otp}`;

    const html = MailService.loadTemplate("OTPTemplate", {
      userName,
      otp,
      date,
    });

    return await this.sendEmail({
      to: email,
      subject,
      text: emailText,
      html,
    });
  }

  async sendForgotPasswordEmail({
    email,
    resetUrl,
    name,
    color = "#000000",
    clientName,
    logo,
    date = new Date().getFullYear(),
  }: {
    email: string;
    resetUrl: string;
    name: string;
    color?: string;
    clientName?: string;
    logo?: string;
    date?: number;
  }): Promise<SentMessageInfo> {
    try {
      const subject = "Reset Your Password";

      const emailText = `
      Hello ${name},\n\n
      You recently requested to reset your password. Please click the link below to proceed:\n
      ${resetUrl}\n\n
      If you did not request this action, you can safely ignore this email.
    `;

      const html = MailService.loadTemplate("forgot-password", {
        resetUrl,
        name,
        color,
        clientName,
        logo,
        date,
      });

      return this.sendEmail({ to: email, subject, text: emailText, html });
    } catch (error) {
      console.error("Error sending forgot password email:", error);
      throw error;
    }
  }

  // Client Onboarding
  async sendOnboardingEmailToClient({
    clientId,
    email,
    plainPassword,
    loginUrl,
  }: {
    clientId: string;
    email: string;
    plainPassword: string;
    loginUrl: string;
  }): Promise<SentMessageInfo> {
    try {
      const subject = "Welcome to HRCore";

      const emailText = `
      A Client Account was created for you on HRCore.\n\n
      Your temporary password is: ${plainPassword}.\n\n
      Please log on to your account and change this password.\n\n
      Click the link below to login:\n
      ${loginUrl}
    `;

      const html = MailService.loadTemplate("client-onboarding", {
        clientId,
        plainPassword,
        loginUrl,
      });

      return this.sendEmail({ to: email, subject, text: emailText, html });
    } catch (error) {
      console.error("Error sending client email:", error);
      throw error;
    }
  }

  //Leaves & Leave Requests
  public async sendLeaveRequestEmailToLineManager({
    clientName,
    color = "#000000",
    logo,
    lineManagerName,
    lineManagerEmail,
    employeeName,
    startDate,
    resumptionDate,
    leaveReason,
    leaveRequestUrl,
    date = new Date().getFullYear(),
  }: {
    clientName: string;
    color?: string;
    logo: string;
    lineManagerName: string;
    lineManagerEmail: string;
    employeeName: string;
    startDate: Date;
    resumptionDate: Date;
    leaveReason: string;
    leaveRequestUrl: string;
    date?: Date | number;
  }): Promise<SentMessageInfo> {
    try {
      const subject = "Leave Request";

      const emailText = `
      Hello ${lineManagerName},\n\n
      ${employeeName} has requested leave from ${startDate} to ${resumptionDate} for the following reason:\n\n
      Reason: ${leaveReason}\n\n
      Click the link below to view leave details:\n
      ${leaveRequestUrl}
    `;

      const html = MailService.loadTemplate("leave-request-to-line-manager", {
        clientName,
        color,
        logo,
        lineManagerName,
        employeeName,
        startDate: formatDate(startDate.toString()),
        resumptionDate: formatDate(resumptionDate.toString()),
        leaveReason,
        leaveRequestUrl,
        date,
      });

      return this.sendEmail({
        to: lineManagerEmail,
        subject,
        text: emailText,
        html,
      });
    } catch (error) {
      console.error("Error sending leave request email:", error);
      throw error;
    }
  }

  async notifyRelieverOfLeaveRequest({
    clientName,
    color = "#000000",
    logo,
    lineManagerName,
    employeeName,
    relieverName,
    relieverEmail,
    startDate,
    resumptionDate,
    leaveReason,
    leaveRequestUrl,
    date = new Date().getFullYear(),
  }: {
    clientName: string;
    color?: string;
    logo: string;
    lineManagerName: string;
    employeeName: string;
    relieverName: string;
    relieverEmail: string;
    startDate: Date;
    resumptionDate: Date;
    leaveReason: string;
    leaveRequestUrl: string;
    date?: Date | number;
  }): Promise<SentMessageInfo> {
    try {
      const subject = "Leave Request";

      const emailText = `
      Hello ${relieverName},\n\n
      ${employeeName} who is relieving his duties to you has requested to go on leave from ${startDate} to ${resumptionDate} for the following reason:\n\n
      Reason: ${leaveReason}\n\n
    `;

      const html = MailService.loadTemplate(
        "notify-reliever-of-leave-request",
        {
          clientName,
          color,
          logo,
          lineManagerName,
          employeeName,
          relieverName,
          relieverEmail,
          startDate: formatDate(startDate.toString()),
          resumptionDate: formatDate(resumptionDate.toString()),
          leaveReason,
          leaveRequestUrl,
          date,
        }
      );

      console.log(`Reliever Email: ${relieverEmail}`);

      return this.sendEmail({
        to: relieverEmail,
        subject,
        text: emailText,
        html,
      });
    } catch (error) {
      console.error("Error notifying reliever:", error);
      throw error;
    }
  }

  async sendLeaveApprovalEmailToEmployee({
    email,
    clientName,
    color = "#000000",
    logo,
    lineManagerName,
    employeeName,
    employeeEmail,
    startDate,
    resumptionDate,
    leaveReason,
    leaveRequestUrl,
    date = new Date().getFullYear(),
  }: {
    email: string;
    clientName: string;
    color?: string;
    logo: string;
    lineManagerName: string;
    employeeName: string;
    employeeEmail: string;
    startDate: Date;
    resumptionDate: Date;
    leaveReason: string;
    leaveRequestUrl: string;
    date?: Date | number;
  }): Promise<SentMessageInfo> {
    try {
      const subject = "Leave Request Approved";

      const emailText = `
      Hello ${employeeName},\n\n
      your leave request from ${startDate} to ${resumptionDate} has been been approved:\n\n
      Click the link below to view leave details:\n
      ${leaveRequestUrl}
    `;

      const html = MailService.loadTemplate("leave-approval-to-employee", {
        clientName,
        color,
        logo,
        lineManagerName,
        employeeName,
        startDate: formatDate(startDate.toString()),
        resumptionDate: formatDate(resumptionDate.toString()),
        leaveReason,
        leaveRequestUrl,
        date,
      });

      return this.sendEmail({
        to: employeeEmail,
        subject,
        text: emailText,
        html,
      });
    } catch (error) {
      console.error("Error sending leave approval email to employee:", error);
      throw error;
    }
  }

  async sendLeaveApprovalEmailToLineManager({
    email,
    clientName,
    color = "#000000",
    logo,
    lineManagerName,
    lineManagerEmail,
    employeeName,
    employeeEmail,
    startDate,
    resumptionDate,
    leaveReason,
    leaveRequestUrl,
    date = new Date().getFullYear(),
  }: {
    email: string;
    clientName: string;
    color?: string;
    logo: string;
    lineManagerName: string;
    lineManagerEmail: string;
    employeeName: string;
    employeeEmail: string;
    startDate: Date;
    resumptionDate: Date;
    leaveReason: string;
    leaveRequestUrl: string;
    date?: Date | number;
  }): Promise<SentMessageInfo> {
    try {
      const subject = "Leave Request Approved";

      const emailText = `
      Hello ${lineManagerName},\n\n
      ${employeeName} who requested to go on leave from ${startDate} to ${resumptionDate} has gotten their second and final approval:\n\n
      Click the link below to view leave details:\n
      ${leaveRequestUrl}
    `;

      const html = MailService.loadTemplate("leave-approval-to-line-manager", {
        clientName,
        color,
        logo,
        lineManagerName,
        employeeName,
        startDate: formatDate(startDate.toString()),
        resumptionDate: formatDate(resumptionDate.toString()),
        leaveReason,
        leaveRequestUrl,
        date,
      });

      return this.sendEmail({
        to: lineManagerEmail,
        subject,
        text: emailText,
        html,
      });
    } catch (error) {
      console.error("Error sending client email:", error);
      throw error;
    }
  }

  async sendLeaveRejectionEmailToEmployeeFromLineManager({
    email,
    clientName,
    color = "#000000",
    logo,
    lineManagerName,
    employeeName,
    employeeEmail,
    startDate,
    resumptionDate,
    leaveReason,
    rejectionReason,
    leaveRequestUrl,
    date = new Date().getFullYear(),
  }: {
    email: string;
    clientName: string;
    color?: string;
    logo: string;
    lineManagerName: string;
    employeeName: string;
    employeeEmail: string;
    startDate: Date;
    resumptionDate: Date;
    leaveReason: string;
    rejectionReason: string | undefined;
    leaveRequestUrl: string;
    date?: Date | number;
  }): Promise<SentMessageInfo> {
    try {
      const subject = "Leave Request";

      const emailText = `
    Hello ${employeeName},\n\n
    we regret to inform you that your leave request from ${startDate} to ${resumptionDate} has been been rejected:\n\n
    Click the link below to view leave details:\n
    ${leaveRequestUrl}
  `;

      // const html = templates.leaveRejectionEmail({
      //   clientName,
      //   color,
      //   logo,
      //   lineManagerName,
      //   employeeName,
      //   startDate: formatDate(startDate),
      //   resumptionDate: formatDate(resumptionDate),
      //   leaveReason,
      //   rejectionReason,
      //   leaveRequestUrl,
      //   date,
      // });

      const html = MailService.loadTemplate("leave-rejection-to-employee", {
        clientName,
        color,
        logo,
        lineManagerName,
        employeeName,
        startDate: formatDate(startDate.toString()),
        resumptionDate: formatDate(resumptionDate.toString()),
        leaveReason,
        rejectionReason,
        leaveRequestUrl,
        date,
      });

      return this.sendEmail({
        to: employeeEmail,
        subject,
        text: emailText,
        html,
      });
    } catch (error) {
      console.error("Error sending client email:", error);
      throw error;
    }
  }

  // Employee Invitation
  async sendInvitationToEmployee({
    email,
    userName,
    clientName,
    inviteUrl,
    plainPassword,
    logo,
    date = new Date(),
  }: {
    email: string;
    userName: string;
    clientName: string;
    inviteUrl: string;
    plainPassword: string;
    logo: string;
    date?: Date;
  }): Promise<SentMessageInfo> {
    try {
      const subject = `Invitation to Join ${clientName} on HRCore`;

      const emailText = `
      Hello ${userName},\n\n
      You have been invited to join the ${clientName} On HRCore. Your temporary password is: ${plainPassword}.
      Please click the link below to complete your registration:\n\n
      ${inviteUrl}
    `;

      const html = MailService.loadTemplate("employee-invitation", {
        userName,
        clientName,
        plainPassword,
        inviteUrl,
        logo,
        date,
      });

      return this.sendEmail({ to: email, subject, text: emailText, html });
    } catch (error) {
      console.error("Error sending invitation email:", error);
      throw error;
    }
  }

  // Super Admin
  async sendLeaveRequestToSuperAdmin({
    clientName,
    clientEmail,
    color = "#000000",
    logo,
    lineManagerName,
    employeeName,
    startDate,
    resumptionDate,
    leaveReason,
    leaveRequestUrl,
    clientLeaveRequestUrl,
    date = new Date().getFullYear(),
  }: {
    email: string;
    clientName: string;
    clientEmail: string;
    color?: string;
    logo: string;
    lineManagerName: string;
    employeeName: string;
    startDate: Date;
    resumptionDate: Date;
    leaveReason: string;
    leaveRequestUrl: string;
    clientLeaveRequestUrl: string;
    date?: Date | number;
  }): Promise<SentMessageInfo> {
    try {
      const subject = "Leave Request";

      const emailText = `
      Hello there,\n\n
      ${employeeName} has requested leave from ${startDate} to ${resumptionDate} and has gotten one confirmation from their line 
      manager ${lineManagerName} for the following reason:\n\n
      Reason: ${leaveReason}\n\n
      Click the link below to view leave details:\n
      ${leaveRequestUrl}
    `;

      const html = MailService.loadTemplate("leave-request-to-super-admin", {
        clientName,
        color,
        logo,
        lineManagerName,
        employeeName,
        startDate: formatDate(startDate.toString()),
        resumptionDate: formatDate(resumptionDate.toString()),
        leaveReason,
        leaveRequestUrl,
        clientLeaveRequestUrl,
        date,
      });

      // Notify Super Admin = (HRBP)
      return this.sendEmail({
        to:
          env.NODE_ENV === "production"
            ? "leave@icsoutsourcing.com"
            : "davidtumuch@gmail.com",
        subject,
        text: emailText,
        html,
      });
    } catch (error) {
      console.error("Error sending client leave request email:", error);
      throw error;
    }
  }

  async sendLeaveRejectionEmailToEmployeeFromAdmin({
    email,
    clientName,
    color = "#000000",
    logo,
    lineManagerName,
    employeeName,
    employeeEmail,
    startDate,
    resumptionDate,
    leaveReason,
    rejectionReason,
    leaveRequestUrl,
    date = new Date().getFullYear(),
  }: {
    email: string;
    clientName: string;
    color?: string;
    logo: string;
    lineManagerName: string;
    employeeName: string;
    employeeEmail: string;
    startDate: Date;
    resumptionDate: Date;
    leaveReason: string;
    rejectionReason: string | undefined;
    leaveRequestUrl: string;
    date?: Date | number;
  }): Promise<SentMessageInfo> {
    try {
      const subject = "Leave Request";

      const emailText = `
    Hello ${employeeName},\n\n
    we regret to inform you that your leave request from ${startDate} to ${resumptionDate} has been been rejected:\n\n
    Click the link below to view leave details:\n
    ${leaveRequestUrl}
  `;

      const html = MailService.loadTemplate(
        "client-leave-rejection-to-employee",
        {
          clientName,
          color,
          logo,
          lineManagerName,
          employeeName,
          startDate: formatDate(startDate.toString()),
          resumptionDate: formatDate(resumptionDate.toString()),
          leaveReason,
          rejectionReason,
          leaveRequestUrl,
          date,
        }
      );

      return this.sendEmail({
        to: employeeEmail,
        subject,
        text: emailText,
        html,
      });
    } catch (error) {
      console.error("Error sending client email:", error);
      throw error;
    }
  }
}

export const mailService = new MailService();
