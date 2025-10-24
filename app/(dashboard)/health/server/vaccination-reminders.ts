"use server";

import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import { sendNotificationEmail } from "@/lib/email";
import { getAuthenticatedUser } from "@/lib/auth-middleware";

// Check and send vaccination reminders
export async function checkAndSendVaccinationReminders(): Promise<ApiResponse<any>> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find reminders that are due today and haven't been sent yet
    const dueReminders = await prisma.vaccinationReminders.findMany({
      where: {
        reminderDate: {
          gte: today,
          lt: tomorrow,
        },
        sentAt: null,
      },
      include: {
        vaccination: {
          include: {
            flock: {
              select: {
                batchCode: true,
              },
            },
          },
        },
      },
    });

    const results = [];

    for (const reminder of dueReminders) {
      const { vaccination } = reminder;
      
      // Send email if enabled
      if (vaccination.sendEmail) {
        // Get staff with email to send reminders
        const staff = await prisma.staff.findMany({
          where: {
            email: { not: null },
            isActive: true,
            role: { in: ["ADMIN", "VETERINARIAN"] },
          },
          select: {
            email: true,
            name: true,
          },
        });

        for (const member of staff) {
          if (member.email) {
            const scheduledDateStr = vaccination.scheduledDate?.toLocaleDateString() || "N/A";
            const message = `Vaccination Reminder: ${vaccination.vaccineName} for flock ${vaccination.flock.batchCode} is scheduled for ${scheduledDateStr}. Please ensure the vaccination is administered as planned.`;
            
            await sendNotificationEmail(member.email, message, "Vaccination Reminder");
          }
        }
      }

      // Create in-app notification if enabled
      if (vaccination.sendInAppAlert) {
        const scheduledDateStr = vaccination.scheduledDate?.toLocaleDateString() || "N/A";
        const message = `Vaccination reminder: ${vaccination.vaccineName} for flock ${vaccination.flock.batchCode} is scheduled for ${scheduledDateStr}`;

        // Get all active staff to notify
        const staff = await prisma.staff.findMany({
          where: {
            isActive: true,
            role: { in: ["ADMIN", "VETERINARIAN"] },
          },
          select: {
            id: true,
          },
        });

        // Create notifications for each staff member
        for (const member of staff) {
          await prisma.notifications.create({
            data: {
              staffId: member.id,
              flockId: vaccination.flockId,
              message: message,
              isRead: false,
            },
          });
        }
      }

      // Mark reminder as sent
      await prisma.vaccinationReminders.update({
        where: { id: reminder.id },
        data: {
          sentAt: new Date(),
          emailSent: vaccination.sendEmail,
          inAppAlertSent: vaccination.sendInAppAlert,
        },
      });

      results.push({
        vaccinationId: vaccination.id,
        reminderSent: true,
      });
    }

    return {
      success: true,
      data: {
        remindersSent: results.length,
        results,
      },
    };
  } catch (error) {
    console.error("Error checking and sending vaccination reminders:", error);
    return {
      success: false,
      message: "Failed to check and send vaccination reminders",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get upcoming vaccinations for home page alerts
export async function getUpcomingVaccinations(daysAhead: number = 14): Promise<ApiResponse<any>> {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const vaccinations = await prisma.vaccinations.findMany({
      where: {
        isScheduled: true,
        status: "scheduled",
        scheduledDate: {
          gte: today,
          lte: futureDate,
        },
      },
      include: {
        flock: {
          select: {
            id: true,
            batchCode: true,
          },
        },
      },
      orderBy: {
        scheduledDate: "asc",
      },
    });

    return {
      success: true,
      data: vaccinations,
    };
  } catch (error) {
    console.error("Error fetching upcoming vaccinations:", error);
    return {
      success: false,
      message: "Failed to fetch upcoming vaccinations",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Create in-app reminder
export async function createInAppReminder(vaccinationId: string, message: string): Promise<ApiResponse<any>> {
  try {
    const vaccination = await prisma.vaccinations.findUnique({
      where: { id: vaccinationId },
    });

    if (!vaccination) {
      return {
        success: false,
        message: "Vaccination not found"
      };
    }

    // Get all active staff to notify
    const staff = await prisma.staff.findMany({
      where: {
        isActive: true,
        role: { in: ["ADMIN", "VETERINARIAN"] },
      },
      select: {
        id: true,
      },
    });

    // Create notifications for each staff member
    const notifications = [];
    for (const member of staff) {
      const notification = await prisma.notifications.create({
        data: {
          staffId: member.id,
          flockId: vaccination.flockId,
          message: message,
          isRead: false,
        },
      });
      notifications.push(notification);
    }

    return {
      success: true,
      data: notifications,
    };
  } catch (error) {
    console.error("Error creating in-app reminder:", error);
    return {
      success: false,
      message: "Failed to create in-app reminder",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Send vaccination email reminder
export async function sendVaccinationEmailReminder(vaccinationId: string): Promise<ApiResponse<any>> {
  try {
    const vaccination = await prisma.vaccinations.findUnique({
      where: { id: vaccinationId },
      include: {
        flock: {
          select: {
            batchCode: true,
          },
        },
      },
    });

    if (!vaccination) {
      return {
        success: false,
        message: "Vaccination not found"
      };
    }

    // Get staff with email
    const staff = await prisma.staff.findMany({
      where: {
        email: { not: null },
        isActive: true,
        role: { in: ["ADMIN", "VETERINARIAN"] },
      },
      select: {
        email: true,
        name: true,
      },
    });

    const emailsSent = [];
    for (const member of staff) {
      if (member.email) {
        const scheduledDateStr = vaccination.scheduledDate?.toLocaleDateString() || "N/A";
        const message = `Vaccination Reminder: ${vaccination.vaccineName} for flock ${vaccination.flock.batchCode} is scheduled for ${scheduledDateStr}. Please ensure the vaccination is administered as planned.`;
        
        const result = await sendNotificationEmail(member.email, message, "Vaccination Reminder");
        emailsSent.push({
          email: member.email,
          sent: result.success,
        });
      }
    }

    return {
      success: true,
      data: {
        emailsSent: emailsSent.length,
        results: emailsSent,
      },
    };
  } catch (error) {
    console.error("Error sending vaccination email reminder:", error);
    return {
      success: false,
      message: "Failed to send vaccination email reminder",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

