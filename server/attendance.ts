"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { AttendanceFilters, CreateAttendanceData, UpdateAttendanceData, ApiResponse, PaginatedResponse } from "./types";

// Check in staff member
export const checkIn = async (staffId: string, location?: string): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;
    
    // Check if user can check in (must be the staff member themselves or admin)
    if (currentUser.id !== staffId && currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        staffId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (existingAttendance) {
      return {
        success: false,
        message: "Already checked in today"
      };
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        staffId,
        date: new Date(),
        status: "Present",
        checkIn: new Date()
      }
    });

    return {
      success: true,
      data: attendance,
      message: "Checked in successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to check in"
    };
  }
};

// Check out staff member
export const checkOut = async (staffId: string, location?: string): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;
    
    // Check if user can check out (must be the staff member themselves or admin)
    if (currentUser.id !== staffId && currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's attendance record
    const attendance = await prisma.attendance.findFirst({
      where: {
        staffId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (!attendance) {
      return {
        success: false,
        message: "No check-in record found for today"
      };
    }

    if (attendance.status === "Checked Out") {
      return {
        success: false,
        message: "Already checked out today"
      };
    }

    // Calculate hours worked
    const checkOutTime = new Date();
    const hoursWorked = attendance.checkIn 
      ? (checkOutTime.getTime() - attendance.checkIn.getTime()) / (1000 * 60 * 60)
      : null;

    // Update attendance record
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        status: "Checked Out",
        checkOut: checkOutTime,
        hours: hoursWorked
      }
    });

    return {
      success: true,
      data: updatedAttendance,
      message: "Checked out successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to check out"
    };
  }
};

// Get attendance records with filters
export const getAttendance = async (filters: AttendanceFilters = {}): Promise<PaginatedResponse<any>> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;
    const { page = 1, limit = 10, staffId, status, dateRange, search } = filters;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (staffId) {
      where.staffId = staffId;
    } else if (currentUser.role !== "ADMIN") {
      // Non-admin users can only see their own attendance
      where.staffId = currentUser.id;
    }

    if (status) {
      where.status = status;
    }

    if (dateRange) {
      where.date = {
        gte: dateRange.start,
        lte: dateRange.end
      };
    }

    if (search) {
      where.staff = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    // Get attendance records with pagination
    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.attendance.count({ where })
    ]);

    return {
      success: true,
      data: attendance,
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
      message: e.message || "Failed to fetch attendance records"
    };
  }
};

// Get staff attendance history
export const getStaffAttendance = async (staffId: string, dateRange?: { start: Date; end: Date }): Promise<ApiResponse> => {
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

    const where: any = { staffId };

    if (dateRange) {
      where.date = {
        gte: dateRange.start,
        lte: dateRange.end
      };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return {
      success: true,
      data: attendance
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to fetch staff attendance"
    };
  }
};

// Update attendance record (Admin only)
export const updateAttendance = async (attendanceId: string, data: UpdateAttendanceData): Promise<ApiResponse> => {
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

    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId }
    });

    if (!attendance) {
      return {
        success: false,
        message: "Attendance record not found"
      };
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status: data.status || attendance.status,
        date: data.checkInTime || attendance.date
      }
    });

    return {
      success: true,
      data: updatedAttendance,
      message: "Attendance record updated successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to update attendance record"
    };
  }
};

// Get attendance statistics
export const getAttendanceStats = async (staffId: string, period: string = 'month'): Promise<ApiResponse> => {
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

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        staffId,
        date: {
          gte: startDate,
          lte: now
        }
      }
    });

    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === "Present" || a.status === "Checked Out").length;
    const absentDays = attendance.filter(a => a.status === "Absent").length;
    const leaveDays = attendance.filter(a => a.status === "On Leave").length;

    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return {
      success: true,
      data: {
        totalDays,
        presentDays,
        absentDays,
        leaveDays,
        attendanceRate: Math.round(attendanceRate * 100) / 100
      }
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to fetch attendance statistics"
    };
  }
};

// Get attendance reports
export const getAttendanceReports = async (filters: AttendanceFilters = {}): Promise<ApiResponse> => {
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

    const { staffId, dateRange, status } = filters;

    const where: any = {};

    if (staffId) {
      where.staffId = staffId;
    }

    if (status) {
      where.status = status;
    }

    if (dateRange) {
      where.date = {
        gte: dateRange.start,
        lte: dateRange.end
      };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Generate summary statistics
    const summary = {
      totalRecords: attendance.length,
      presentCount: attendance.filter(a => a.status === "Present" || a.status === "Checked Out").length,
      absentCount: attendance.filter(a => a.status === "Absent").length,
      leaveCount: attendance.filter(a => a.status === "On Leave").length,
      byRole: {} as Record<string, number>
    };

    // Count by role
    attendance.forEach(record => {
      const role = record.staff.role;
      summary.byRole[role] = (summary.byRole[role] || 0) + 1;
    });

    return {
      success: true,
      data: {
        records: attendance,
        summary
      }
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to generate attendance report"
    };
  }
};

// Delete attendance record (for undo functionality)
export const deleteAttendance = async (attendanceId: string): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;
    
    // Only admin can delete attendance records
    if (currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    // Delete the attendance record
    await prisma.attendance.delete({
      where: { id: attendanceId }
    });

    return {
      success: true,
      message: "Attendance record deleted successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to delete attendance record"
    };
  }
};
