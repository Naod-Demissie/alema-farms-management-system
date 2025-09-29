"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { AttendanceFilters, CreateAttendanceData, UpdateAttendanceData, ApiResponse, PaginatedResponse } from "./types";
import { getServerSession } from "@/lib/auth";

// Check in staff member
export const checkIn = async (staffId: string, location?: string): Promise<ApiResponse> => {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const user = session.user;

    // Check if user has permission to check in
    if (user.role !== "ADMIN" && user.id !== staffId) {
      return {
        success: false,
        message: "You can only check in yourself"
      };
    }

    // Check if staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId }
    });

    if (!staff) {
      return {
        success: false,
        message: "Staff member not found"
      };
    }

    if (!staff.isActive) {
      return {
        success: false,
        message: "Inactive staff members cannot check in"
      };
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingCheckIn = await prisma.attendance.findFirst({
      where: {
        staffId,
        date: {
          gte: today,
          lt: tomorrow
        },
        checkOut: null
      }
    });

    if (existingCheckIn) {
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
        checkIn: new Date(),
        status: "PRESENT"
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
    const session = await getServerSession();

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const user = session.user;

    // Check if user has permission to check out
    if (user.role !== "ADMIN" && user.id !== staffId) {
      return {
        success: false,
        message: "You can only check out yourself"
      };
    }

    // Check if staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId }
    });

    if (!staff) {
      return {
        success: false,
        message: "Staff member not found"
      };
    }

    // Find today's check-in record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await prisma.attendance.findFirst({
      where: {
        staffId,
        date: {
          gte: today,
          lt: tomorrow
        },
        checkOut: null
      }
    });

    if (!attendance) {
      return {
        success: false,
        message: "No active check-in found for today"
      };
    }

    // Calculate hours worked
    const checkOutTime = new Date();
    const hoursWorked = attendance.checkIn ? 
      (checkOutTime.getTime() - attendance.checkIn.getTime()) / (1000 * 60 * 60) : 0;

    // Update attendance record with check-out time
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: checkOutTime,
        hours: hoursWorked,
        status: "COMPLETED"
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

// Get attendance records with filtering and pagination
export const getAttendance = async (filters: AttendanceFilters = {}): Promise<PaginatedResponse<any>> => {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required",
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      };
    }

    const user = session.user;

    // Check if user has permission to view attendance
    if (user.role !== "ADMIN" && user.role !== "VETERINARIAN") {
      return {
        success: false,
        message: "Insufficient permissions to view attendance records",
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      };
    }

    const { page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.staffId) {
      where.staffId = filters.staffId;
    }

    if (filters.dateRange) {
      where.date = {};
      if (filters.dateRange.start) {
        where.date.gte = filters.dateRange.start;
      }
      if (filters.dateRange.end) {
        where.date.lte = filters.dateRange.end;
      }
    }

    if (filters.location) {
      where.status = { contains: filters.location, mode: 'insensitive' };
    }

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
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
      message: e.message || "Failed to fetch attendance records",
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
    };
  }
};

// Get attendance records for a specific staff member
export const getStaffAttendance = async (staffId: string, dateRange?: { start: Date; end: Date }): Promise<ApiResponse> => {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const user = session.user;

    // Check if user has permission to view this staff's attendance
    if (user.role !== "ADMIN" && user.role !== "VETERINARIAN" && user.id !== staffId) {
      return {
        success: false,
        message: "Insufficient permissions to view this staff member's attendance"
      };
    }

    // Check if staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId }
    });

    if (!staff) {
      return {
        success: false,
        message: "Staff member not found"
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
      orderBy: { date: 'desc' },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true,
            role: true
          }
        }
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

// Update attendance record
export const updateAttendance = async (attendanceId: string, data: UpdateAttendanceData): Promise<ApiResponse> => {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const user = session.user;

    // Check if user has permission to update attendance
    if (user.role !== "ADMIN") {
      return {
        success: false,
        message: "Only administrators can update attendance records"
      };
    }

    // Check if attendance record exists
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: attendanceId }
    });

    if (!existingAttendance) {
      return {
        success: false,
        message: "Attendance record not found"
      };
    }

    const updateData: any = {};
    
    if (data.checkInTime) updateData.checkIn = data.checkInTime;
    if (data.checkOutTime) updateData.checkOut = data.checkOutTime;
    if (data.location) updateData.status = data.location;

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: updateData,
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true,
            role: true
          }
        }
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

// Get attendance statistics for a staff member
export const getAttendanceStats = async (staffId: string, period: string = 'month'): Promise<ApiResponse> => {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const user = session.user;

    // Check if user has permission to view this staff's stats
    if (user.role !== "ADMIN" && user.role !== "VETERINARIAN" && user.id !== staffId) {
      return {
        success: false,
        message: "Insufficient permissions to view this staff member's statistics"
      };
    }

    // Check if staff exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId }
    });

    if (!staff) {
      return {
        success: false,
        message: "Staff member not found"
      };
    }

    // Calculate date range based on period
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
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days
    }

    const where = {
      staffId,
      date: {
        gte: startDate,
        lte: now
      }
    };

    const [totalDays, completedDays, totalHours] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.count({
        where: {
          ...where,
          checkOut: { not: null }
        }
      }),
      prisma.attendance.aggregate({
        where: {
          ...where,
          checkOut: { not: null }
        },
        _sum: {
          hours: true
        }
      })
    ]);

    const averageHoursPerDay = completedDays > 0 ? (totalHours._sum.hours || 0) / completedDays : 0;

    return {
      success: true,
      data: {
        totalDays,
        completedDays,
        totalHours: totalHours._sum.hours || 0,
        averageHoursPerDay,
        period
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
    const session = await getServerSession();

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const user = session.user;

    // Check if user has permission to view reports
    if (user.role !== "ADMIN" && user.role !== "VETERINARIAN") {
      return {
        success: false,
        message: "Insufficient permissions to view attendance reports"
      };
    }

    const where: any = {};

    if (filters.staffId) {
      where.staffId = filters.staffId;
    }

    if (filters.dateRange) {
      where.date = {};
      if (filters.dateRange.start) {
        where.date.gte = filters.dateRange.start;
      }
      if (filters.dateRange.end) {
        where.date.lte = filters.dateRange.end;
      }
    }

    // Get attendance records with staff information
    const attendance = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Calculate summary statistics
    const totalRecords = attendance.length;
    const completedRecords = attendance.filter(record => record.checkOut !== null).length;
    const totalHours = attendance.reduce((sum, record) => sum + (record.hours || 0), 0);
    const averageHoursPerDay = completedRecords > 0 ? totalHours / completedRecords : 0;

    // Group by staff member
    const staffSummary = attendance.reduce((acc, record) => {
      const staffId = record.staffId;
      if (!acc[staffId]) {
        acc[staffId] = {
          staff: record.staff,
          totalDays: 0,
          completedDays: 0,
          totalHours: 0
        };
      }
      acc[staffId].totalDays++;
      if (record.checkOut) {
        acc[staffId].completedDays++;
        acc[staffId].totalHours += record.hours || 0;
      }
      return acc;
    }, {} as any);

    return {
      success: true,
      data: {
        summary: {
          totalRecords,
          completedRecords,
          totalHours,
          averageHoursPerDay
        },
        staffSummary: Object.values(staffSummary),
        attendance
      }
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to fetch attendance reports"
    };
  }
};

// Delete attendance record
export const deleteAttendance = async (attendanceId: string): Promise<ApiResponse> => {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const user = session.user;

    // Check if user has permission to delete attendance
    if (user.role !== "ADMIN") {
      return {
        success: false,
        message: "Only administrators can delete attendance records"
      };
    }

    // Check if attendance record exists
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: attendanceId }
    });

    if (!existingAttendance) {
      return {
        success: false,
        message: "Attendance record not found"
      };
    }

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