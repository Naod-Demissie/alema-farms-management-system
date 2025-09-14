"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { LeaveFilters, CreateLeaveRequestData, LeaveBalanceData, ApiResponse, PaginatedResponse } from "./types";

// Create leave request
export const createLeaveRequest = async (data: CreateLeaveRequestData): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;
    
    // Check if user can create leave request (must be the staff member themselves or admin)
    if (currentUser.id !== data.staffId && currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    // Validate dates
    if (data.startDate >= data.endDate) {
      return {
        success: false,
        message: "End date must be after start date"
      };
    }

    if (data.startDate < new Date()) {
      return {
        success: false,
        message: "Cannot request leave for past dates"
      };
    }

    // Check for overlapping leave requests
    const overlappingRequest = await prisma.leaveRequest.findFirst({
      where: {
        staffId: data.staffId,
        status: {
          in: ['PENDING', 'APPROVED']
        },
        OR: [
          {
            AND: [
              { startDate: { lte: data.startDate } },
              { endDate: { gte: data.startDate } }
            ]
          },
          {
            AND: [
              { startDate: { lte: data.endDate } },
              { endDate: { gte: data.endDate } }
            ]
          },
          {
            AND: [
              { startDate: { gte: data.startDate } },
              { endDate: { lte: data.endDate } }
            ]
          }
        ]
      }
    });

    if (overlappingRequest) {
      return {
        success: false,
        message: "You already have a leave request for this period"
      };
    }

    // Calculate leave days
    const leaveDays = Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Check leave balance
    const leaveBalance = await prisma.leaveBalance.findUnique({
      where: { staffId: data.staffId }
    });

    if (!leaveBalance) {
      return {
        success: false,
        message: "Leave balance not found. Please contact administrator."
      };
    }

    if (leaveBalance.remainingLeaveDays < leaveDays) {
      return {
        success: false,
        message: `Insufficient leave balance. You have ${leaveBalance.remainingLeaveDays} days remaining, but requesting ${leaveDays} days.`
      };
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        staffId: data.staffId,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason
      },
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
      }
    });

    return {
      success: true,
      data: leaveRequest,
      message: "Leave request submitted successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to create leave request"
    };
  }
};

// Get leave requests with filters
export const getLeaveRequests = async (filters: LeaveFilters = {}): Promise<PaginatedResponse<any>> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;
    const { page = 1, limit = 10, staffId, leaveType, status, approverId, search } = filters;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (staffId) {
      where.staffId = staffId;
    } else if (currentUser.role !== "ADMIN") {
      // Non-admin users can only see their own leave requests
      where.staffId = currentUser.id;
    }

    if (leaveType) {
      where.leaveType = leaveType;
    }

    if (status) {
      where.status = status;
    }

    if (approverId) {
      where.approvedBy = approverId;
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

    // Get leave requests with pagination
    const [leaveRequests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
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
          },
          approver: {
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
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.leaveRequest.count({ where })
    ]);

    // Calculate leave days for each request
    const leaveRequestsWithDays = leaveRequests.map(request => ({
      ...request,
      leaveDays: Math.ceil((request.endDate.getTime() - request.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    }));

    return {
      success: true,
      data: leaveRequestsWithDays,
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
      message: e.message || "Failed to fetch leave requests"
    };
  }
};

// Get staff leave requests
export const getStaffLeaveRequests = async (staffId: string): Promise<ApiResponse> => {
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

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: { staffId },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            role: true
          }
        },
        approver: {
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
        createdAt: 'desc'
      }
    });

    // Calculate leave days for each request
    const leaveRequestsWithDays = leaveRequests.map(request => ({
      ...request,
      leaveDays: Math.ceil((request.endDate.getTime() - request.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    }));

    return {
      success: true,
      data: leaveRequestsWithDays
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to fetch staff leave requests"
    };
  }
};

// Approve leave request
export const approveLeaveRequest = async (leaveId: string, approverId: string): Promise<ApiResponse> => {
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

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true
          }
        }
      }
    });

    if (!leaveRequest) {
      return {
        success: false,
        message: "Leave request not found"
      };
    }

    if (leaveRequest.status !== 'PENDING') {
      return {
        success: false,
        message: "Leave request has already been processed"
      };
    }

    // Calculate leave days
    const leaveDays = Math.ceil((leaveRequest.endDate.getTime() - leaveRequest.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Update leave request
    const updatedRequest = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: 'APPROVED',
        approvedBy: approverId
      },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            role: true
          }
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            role: true
          }
        }
      }
    });

    // Update leave balance
    await prisma.leaveBalance.update({
      where: { staffId: leaveRequest.staffId },
      data: {
        usedLeaveDays: {
          increment: leaveDays
        },
        remainingLeaveDays: {
          decrement: leaveDays
        }
      }
    });

    return {
      success: true,
      data: updatedRequest,
      message: "Leave request approved successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to approve leave request"
    };
  }
};

// Reject leave request
export const rejectLeaveRequest = async (leaveId: string, approverId: string, reason?: string): Promise<ApiResponse> => {
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

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveId }
    });

    if (!leaveRequest) {
      return {
        success: false,
        message: "Leave request not found"
      };
    }

    if (leaveRequest.status !== 'PENDING') {
      return {
        success: false,
        message: "Leave request has already been processed"
      };
    }

    // Update leave request
    const updatedRequest = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: 'REJECTED',
        approvedBy: approverId,
        reason: reason || leaveRequest.reason
      },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            role: true
          }
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            role: true
          }
        }
      }
    });

    return {
      success: true,
      data: updatedRequest,
      message: "Leave request rejected successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to reject leave request"
    };
  }
};

// Cancel leave request
export const cancelLeaveRequest = async (leaveId: string): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;
    
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveId }
    });

    if (!leaveRequest) {
      return {
        success: false,
        message: "Leave request not found"
      };
    }

    // Check permissions - staff can cancel their own requests, admin can cancel any
    if (currentUser.id !== leaveRequest.staffId && currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    if (leaveRequest.status !== 'PENDING') {
      return {
        success: false,
        message: "Only pending leave requests can be cancelled"
      };
    }

    // Update leave request
    const updatedRequest = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: 'CANCELLED'
      }
    });

    return {
      success: true,
      data: updatedRequest,
      message: "Leave request cancelled successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to cancel leave request"
    };
  }
};

// Get leave balance
export const getLeaveBalance = async (staffId: string, year?: number): Promise<ApiResponse> => {
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

    const targetYear = year || new Date().getFullYear();

    const leaveBalance = await prisma.leaveBalance.findUnique({
      where: { staffId }
    });

    if (!leaveBalance) {
      return {
        success: false,
        message: "Leave balance not found"
      };
    }

    return {
      success: true,
      data: leaveBalance
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to fetch leave balance"
    };
  }
};

// Update leave balance
export const updateLeaveBalance = async (staffId: string, data: LeaveBalanceData): Promise<ApiResponse> => {
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

    const leaveBalance = await prisma.leaveBalance.upsert({
      where: { staffId },
      update: {
        year: data.year,
        totalLeaveDays: data.totalLeaveDays,
        usedLeaveDays: data.usedLeaveDays || 0,
        remainingLeaveDays: data.totalLeaveDays - (data.usedLeaveDays || 0)
      },
      create: {
        staffId: data.staffId,
        year: data.year,
        totalLeaveDays: data.totalLeaveDays,
        usedLeaveDays: data.usedLeaveDays || 0,
        remainingLeaveDays: data.totalLeaveDays - (data.usedLeaveDays || 0)
      }
    });

    return {
      success: true,
      data: leaveBalance,
      message: "Leave balance updated successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to update leave balance"
    };
  }
};

// Get leave calendar
export const getLeaveCalendar = async (year: number, month: number): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } }
            ]
          }
        ]
      },
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
      }
    });

    return {
      success: true,
      data: leaveRequests
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to fetch leave calendar"
    };
  }
};

// Get leave reports
export const getLeaveReports = async (filters: LeaveFilters = {}): Promise<ApiResponse> => {
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

    const { staffId, leaveType, status, search } = filters;

    const where: any = {};

    if (staffId) {
      where.staffId = staffId;
    }

    if (leaveType) {
      where.leaveType = leaveType;
    }

    if (status) {
      where.status = status;
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

    const leaveRequests = await prisma.leaveRequest.findMany({
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
        },
        approver: {
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
        createdAt: 'desc'
      }
    });

    // Generate summary statistics
    const summary = {
      totalRequests: leaveRequests.length,
      approvedRequests: leaveRequests.filter(r => r.status === 'APPROVED').length,
      pendingRequests: leaveRequests.filter(r => r.status === 'PENDING').length,
      rejectedRequests: leaveRequests.filter(r => r.status === 'REJECTED').length,
      cancelledRequests: leaveRequests.filter(r => r.status === 'CANCELLED').length,
      byLeaveType: {} as Record<string, number>,
      byRole: {} as Record<string, number>
    };

    // Calculate statistics by leave type and role
    leaveRequests.forEach(request => {
      const leaveType = request.leaveType;
      const role = request.staff.role;
      
      summary.byLeaveType[leaveType] = (summary.byLeaveType[leaveType] || 0) + 1;
      summary.byRole[role] = (summary.byRole[role] || 0) + 1;
    });

    return {
      success: true,
      data: {
        records: leaveRequests,
        summary
      }
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to generate leave report"
    };
  }
};
