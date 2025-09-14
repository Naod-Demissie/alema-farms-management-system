"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NotificationFilters, CreateNotificationData, SendNotificationData, ApiResponse, PaginatedResponse } from "./types";
import { sendNotificationEmail } from "./email";

// Get notifications for a staff member
export const getNotifications = async (staffId: string, filters: NotificationFilters = {}): Promise<PaginatedResponse<any>> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;
    
    // Check permissions
    if (currentUser.id !== staffId && currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    const { page = 1, limit = 10, isRead, type, search } = filters;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = { staffId };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.message = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Get notifications with pagination
    const [notifications, total] = await Promise.all([
      prisma.notifications.findMany({
        where,
        include: {
          flock: {
            select: {
              id: true,
              batchCode: true,
              breed: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.notifications.count({ where })
    ]);

    return {
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to fetch notifications"
    };
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;

    const notification = await prisma.notifications.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return {
        success: false,
        message: "Notification not found"
      };
    }

    // Check permissions
    if (currentUser.id !== notification.staffId && currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    const updatedNotification = await prisma.notifications.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    return {
      success: true,
      data: updatedNotification,
      message: "Notification marked as read"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to mark notification as read"
    };
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (staffId: string): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;
    
    // Check permissions
    if (currentUser.id !== staffId && currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    await prisma.notifications.updateMany({
      where: { 
        staffId,
        isRead: false
      },
      data: { isRead: true }
    });

    return {
      success: true,
      message: "All notifications marked as read"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to mark all notifications as read"
    };
  }
};

// Send notification to staff
export const sendNotification = async (data: SendNotificationData): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;
    
    if (currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    // Validate staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: data.staffId }
    });

    if (!staff) {
      return {
        success: false,
        message: "Staff member not found"
      };
    }

    // Create notification
    const notification = await prisma.notifications.create({
      data: {
        staffId: data.staffId,
        flockId: data.flockId,
        message: data.message,
        type: data.type || 'general',
        priority: data.priority || 'medium'
      },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true
          }
        },
        flock: {
          select: {
            id: true,
            batchCode: true,
            breed: true
          }
        }
      }
    });

    // Send email if requested using centralized service
    if (data.sendEmail && staff.email) {
      const emailResult = await sendNotificationEmail(staff.email, data.message, data.type || 'general');
      if (!emailResult.success) {
        console.error("Failed to send notification email:", emailResult.message);
      }
    }

    return {
      success: true,
      data: notification,
      message: "Notification sent successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to send notification"
    };
  }
};

// Create notification (internal use)
export const createNotification = async (data: CreateNotificationData): Promise<ApiResponse> => {
  try {
    // Validate staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: data.staffId }
    });

    if (!staff) {
      return {
        success: false,
        message: "Staff member not found"
      };
    }

    // Create notification
    const notification = await prisma.notifications.create({
      data: {
        staffId: data.staffId,
        flockId: data.flockId,
        message: data.message,
        type: data.type || 'general',
        priority: data.priority || 'medium'
      }
    });

    return {
      success: true,
      data: notification
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to create notification"
    };
  }
};

// Get unread notification count
export const getUnreadCount = async (staffId: string): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;
    
    // Check permissions
    if (currentUser.id !== staffId && currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    const count = await prisma.notifications.count({
      where: {
        staffId,
        isRead: false
      }
    });

    return {
      success: true,
      data: { count }
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get unread count"
    };
  }
};

// Delete notification
export const deleteNotification = async (notificationId: string): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;

    const notification = await prisma.notifications.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return {
        success: false,
        message: "Notification not found"
      };
    }

    // Check permissions
    if (currentUser.id !== notification.staffId && currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    await prisma.notifications.delete({
      where: { id: notificationId }
    });

    return {
      success: true,
      message: "Notification deleted successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to delete notification"
    };
  }
};

// Send bulk notifications
export const sendBulkNotifications = async (staffIds: string[], message: string, type?: string, flockId?: string): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;
    
    if (currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    // Validate all staff exist
    const staff = await prisma.staff.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, email: true }
    });

    if (staff.length !== staffIds.length) {
      return {
        success: false,
        message: "Some staff members not found"
      };
    }

    // Create notifications for all staff
    const notifications = await Promise.all(
      staffIds.map(staffId =>
        prisma.notifications.create({
          data: {
            staffId,
            flockId,
            message,
            type: type || 'general',
            priority: 'medium'
          }
        })
      )
    );

    // Send emails to staff with email addresses using centralized service
    const emailPromises = staff
      .filter(s => s.email)
      .map(s => sendNotificationEmail(s.email!, message, type || 'general'));

    await Promise.allSettled(emailPromises);

    return {
      success: true,
      data: notifications,
      message: `Notifications sent to ${notifications.length} staff members`
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to send bulk notifications"
    };
  }
};

// Get notification statistics
export const getNotificationStats = async (staffId?: string): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;
    
    // Check permissions
    if (staffId && currentUser.id !== staffId && currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    const where = staffId ? { staffId } : {};

    const [total, unread, byType] = await Promise.all([
      prisma.notifications.count({ where }),
      prisma.notifications.count({ where: { ...where, isRead: false } }),
      prisma.notifications.groupBy({
        by: ['type'],
        where,
        _count: { type: true }
      })
    ]);

    const stats = {
      total,
      unread,
      read: total - unread,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>)
    };

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get notification statistics"
    };
  }
};

