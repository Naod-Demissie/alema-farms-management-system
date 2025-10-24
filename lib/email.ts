"use server";

import { config } from "dotenv";
import { EmailData, ApiResponse } from "./types";
import transporter from "@/lib/nodemailer";

// Load environment variables
config();

// Send email (internal function - no auth required)
export const sendEmail = async (data: EmailData): Promise<ApiResponse> => {
  try {
    // Validate email data
    if (!data.to || !data.subject || !data.template) {
      return {
        success: false,
        message: "Missing required email fields"
      };
    }

    // Get email template
    const template = getEmailTemplate(data.template, data.data);

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: data.to,
      subject: data.subject,
      html: template.html,
      text: template.text
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: "Email sent successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to send email"
    };
  }
};

// Send invite email (internal function)
export const sendInviteEmail = async (email: string, token: string, role: string): Promise<ApiResponse> => {
  try {
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/complete-registration?token=${token}&email=${encodeURIComponent(email)}`;
    
    const template = getInviteEmailTemplate(inviteUrl, role);
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Invitation to join Poultry Farm Management System`,
      html: template.html,
      text: template.text
    };

    await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: "Invite email sent successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to send invite email"
    };
  }
};

// Send magic link email (for staff registration completion)
export const sendMagicLinkEmail = async (email: string, token: string, role: string): Promise<ApiResponse> => {
  try {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/complete-registration?token=${token}&email=${encodeURIComponent(email)}`;
    
    const template = getMagicLinkEmailTemplate(url, role);
    const mailOptions = {
      from: process.env.NODEMAILER_USER,
      to: email,
      subject: "Complete Your Staff Registration - Magic Link",
      html: template.html,
      text: template.text
    };

    await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: "Magic link email sent successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to send magic link email"
    };
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string, token: string): Promise<ApiResponse> => {
  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    
    const template = getPasswordResetEmailTemplate(resetUrl);
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Password Reset - Poultry Farm Management System`,
      html: template.html,
      text: template.text
    };

    await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: "Password reset email sent successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to send password reset email"
    };
  }
};

// Send notification email
export const sendNotificationEmail = async (email: string, message: string, type: string): Promise<ApiResponse> => {
  try {
    const template = getNotificationEmailTemplate(message, type);
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Poultry Farm Notification - ${type.toUpperCase()}`,
      html: template.html,
      text: template.text
    };

    await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: "Notification email sent successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to send notification email"
    };
  }
};

// Send welcome email
export const sendWelcomeEmail = async (email: string, name: string, role: string): Promise<ApiResponse> => {
  try {
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;
    
    const template = getWelcomeEmailTemplate(name, role, loginUrl);
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Welcome to Poultry Farm Management System`,
      html: template.html,
      text: template.text
    };

    await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: "Welcome email sent successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to send welcome email"
    };
  }
};

// Send leave approval email
export const sendLeaveApprovalEmail = async (email: string, leaveData: any): Promise<ApiResponse> => {
  try {
    const template = getLeaveApprovalEmailTemplate(leaveData);
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Leave Request ${leaveData.status} - Poultry Farm Management System`,
      html: template.html,
      text: template.text
    };

    await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: "Leave approval email sent successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to send leave approval email"
    };
  }
};

// Send payroll notification email
export const sendPayrollNotificationEmail = async (email: string, payrollData: any): Promise<ApiResponse> => {
  try {
    const template = getPayrollNotificationEmailTemplate(payrollData);
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Payroll Notification - Poultry Farm Management System`,
      html: template.html,
      text: template.text
    };

    await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: "Payroll notification email sent successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to send payroll notification email"
    };
  }
};

// Helper function to get email template
function getEmailTemplate(template: string, data: any) {
  const templates: Record<string, any> = {
    'invite': getInviteEmailTemplate(data.url, data.role),
    'password-reset': getPasswordResetEmailTemplate(data.url),
    'notification': getNotificationEmailTemplate(data.message, data.type),
    'welcome': getWelcomeEmailTemplate(data.name, data.role, data.loginUrl),
    'leave-approval': getLeaveApprovalEmailTemplate(data),
    'payroll-notification': getPayrollNotificationEmailTemplate(data)
  };

  return templates[template] || {
    html: `<p>${data.message || 'Email content'}</p>`,
    text: data.message || 'Email content'
  };
}

// Email templates
function getInviteEmailTemplate(inviteUrl: string, role: string) {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You're invited to join our Poultry Farm Management System</h2>
        <p>You have been invited to join as a <strong>${role}</strong> in our poultry farm management system.</p>
        <p>Click the button below to complete your registration and create your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Complete Registration
          </a>
        </div>
        <p>This invitation will expire in 7 days.</p>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${inviteUrl}</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          If you didn't expect this invitation, please ignore this email.
        </p>
      </div>
    `,
    text: `You're invited to join our Poultry Farm Management System as a ${role}. Click here to complete your registration: ${inviteUrl}`
  };
}

function getMagicLinkEmailTemplate(url: string, role: string) {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to ${process.env.NEXT_PUBLIC_FARM_NAME || 'Poultry Farm Management'}</h2>
        <p>You have been invited to join our staff as a <strong>${role}</strong>. Please click the link below to complete your registration:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Registration</a>
        </div>
        <p style="color: #666; font-size: 14px;">This link will expire in 24 hours. If you didn't expect this invitation, please ignore this email.</p>
        <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #007bff; word-break: break-all;">${url}</p>
      </div>
    `,
    text: `Welcome to ${process.env.NEXT_PUBLIC_FARM_NAME || 'Poultry Farm Management'}! Complete your registration: ${url}`
  };
}

function getPasswordResetEmailTemplate(resetUrl: string) {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password for the Poultry Farm Management System.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          If the button doesn't work, copy and paste this link: ${resetUrl}
        </p>
      </div>
    `,
    text: `Password reset requested. Click here to reset: ${resetUrl}`
  };
}

function getNotificationEmailTemplate(message: string, type: string) {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Poultry Farm Management System Notification</h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px;">${message}</p>
        </div>
        <p>Please log in to the system to view more details.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from the Poultry Farm Management System.
        </p>
      </div>
    `,
    text: `Notification: ${message}`
  };
}

function getWelcomeEmailTemplate(name: string, role: string, loginUrl: string) {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Poultry Farm Management System!</h2>
        <p>Hello ${name},</p>
        <p>Welcome to our Poultry Farm Management System! Your account has been created successfully.</p>
        <p>Your role: <strong>${role}</strong></p>
        <p>You can now log in to the system using your credentials:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" 
             style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Log In Now
          </a>
        </div>
        <p>If you have any questions, please contact your supervisor or the system administrator.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated welcome email from the Poultry Farm Management System.
        </p>
      </div>
    `,
    text: `Welcome ${name}! Your account has been created. Log in at: ${loginUrl}`
  };
}

function getLeaveApprovalEmailTemplate(leaveData: any) {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Leave Request ${leaveData.status}</h2>
        <p>Your leave request has been <strong>${leaveData.status.toLowerCase()}</strong>.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Leave Type:</strong> ${leaveData.leaveType}</p>
          <p><strong>Start Date:</strong> ${new Date(leaveData.startDate).toLocaleDateString()}</p>
          <p><strong>End Date:</strong> ${new Date(leaveData.endDate).toLocaleDateString()}</p>
          <p><strong>Reason:</strong> ${leaveData.reason || 'N/A'}</p>
        </div>
        <p>Please log in to the system to view more details.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from the Poultry Farm Management System.
        </p>
      </div>
    `,
    text: `Leave request ${leaveData.status}: ${leaveData.leaveType} from ${new Date(leaveData.startDate).toLocaleDateString()} to ${new Date(leaveData.endDate).toLocaleDateString()}`
  };
}

function getPayrollNotificationEmailTemplate(payrollData: any) {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payroll Notification</h2>
        <p>Your payroll information is now available.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Pay Period:</strong> ${payrollData.period || 'N/A'}</p>
          <p><strong>Base Salary:</strong> $${payrollData.salary?.toFixed(2) || '0.00'}</p>
          <p><strong>Bonus:</strong> $${(payrollData.bonus || 0).toFixed(2)}</p>
          <p><strong>Deductions:</strong> $${(payrollData.deductions || 0).toFixed(2)}</p>
          <p><strong>Net Salary:</strong> $${((payrollData.salary || 0) + (payrollData.bonus || 0) - (payrollData.deductions || 0)).toFixed(2)}</p>
        </div>
        <p>Please log in to the system to view your detailed payslip.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from the Poultry Farm Management System.
        </p>
      </div>
    `,
    text: `Payroll notification: Net salary $${((payrollData.salary || 0) + (payrollData.bonus || 0) - (payrollData.deductions || 0)).toFixed(2)}`
  };
}

// Send vaccination reminder email
export const sendVaccinationReminderEmail = async (
  email: string, 
  vaccinationData: {
    vaccineName: string;
    flockBatchCode: string;
    scheduledDate: string;
    administeredBy: string;
    quantity: number;
    dosage: string;
    administrationMethod?: string;
  }
): Promise<ApiResponse> => {
  try {
    const template = getVaccinationReminderEmailTemplate(vaccinationData);
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Vaccination Reminder - ${vaccinationData.vaccineName}`,
      html: template.html,
      text: template.text
    };

    await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: "Vaccination reminder email sent successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to send vaccination reminder email"
    };
  }
};

function getVaccinationReminderEmailTemplate(vaccinationData: {
  vaccineName: string;
  flockBatchCode: string;
  scheduledDate: string;
  administeredBy: string;
  quantity: number;
  dosage: string;
  administrationMethod?: string;
}) {
  const methodDisplay = vaccinationData.administrationMethod 
    ? vaccinationData.administrationMethod.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
    : 'N/A';

  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">🔔 Vaccination Reminder</h2>
        <p>This is a reminder that a vaccination is scheduled soon.</p>
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #856404;">Vaccination Details</h3>
          <p style="margin: 8px 0;"><strong>Vaccine Name:</strong> ${vaccinationData.vaccineName}</p>
          <p style="margin: 8px 0;"><strong>Flock:</strong> ${vaccinationData.flockBatchCode}</p>
          <p style="margin: 8px 0;"><strong>Scheduled Date:</strong> ${vaccinationData.scheduledDate}</p>
          <p style="margin: 8px 0;"><strong>To Be Administered By:</strong> ${vaccinationData.administeredBy}</p>
          <p style="margin: 8px 0;"><strong>Quantity:</strong> ${vaccinationData.quantity}</p>
          <p style="margin: 8px 0;"><strong>Dosage:</strong> ${vaccinationData.dosage}</p>
          <p style="margin: 8px 0;"><strong>Administration Method:</strong> ${methodDisplay}</p>
        </div>
        <p style="margin: 20px 0;">Please ensure that:</p>
        <ul style="line-height: 1.8;">
          <li>All necessary vaccination supplies are available</li>
          <li>The veterinarian is available on the scheduled date</li>
          <li>The flock is prepared for vaccination</li>
          <li>Proper records are maintained after administration</li>
        </ul>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #666;">
            <strong>Note:</strong> Please log in to the Poultry Farm Management System to mark the vaccination as completed once it has been administered.
          </p>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated reminder from the Poultry Farm Management System.
        </p>
      </div>
    `,
    text: `
      VACCINATION REMINDER
      
      Vaccine Name: ${vaccinationData.vaccineName}
      Flock: ${vaccinationData.flockBatchCode}
      Scheduled Date: ${vaccinationData.scheduledDate}
      To Be Administered By: ${vaccinationData.administeredBy}
      Quantity: ${vaccinationData.quantity}
      Dosage: ${vaccinationData.dosage}
      Administration Method: ${methodDisplay}
      
      Please ensure all necessary supplies are available and the veterinarian is scheduled.
      Log in to the system to mark as completed after administration.
    `
  };
}