"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-middleware";
import { ApiResponse, PaginatedResponse } from "@/lib/types";
import { PayrollFilters, CreatePayrollData, UpdatePayrollData } from "../types/types";

// Create payroll record
export const createPayroll = async (data: CreatePayrollData): Promise<ApiResponse> => {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }
    const currentUser = authResult.user as any;
    
    if (currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions to create payroll records"
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

    // Check if payroll already exists for this period
    const existingPayroll = await prisma.payroll.findFirst({
      where: {
        staffId: data.staffId,
        paidOn: {
          gte: new Date(data.paidOn.getFullYear(), data.paidOn.getMonth(), 1),
          lt: new Date(data.paidOn.getFullYear(), data.paidOn.getMonth() + 1, 1)
        }
      }
    });

    if (existingPayroll) {
      return {
        success: false,
        message: "Payroll record already exists for this period"
      };
    }

    // Calculate net salary
    const deductions = data.deductions || 0;
    const bonus = data.bonus || 0;
    const netSalary = data.salary + bonus - deductions;

    // Create payroll record
    const payroll = await prisma.payroll.create({
      data: {
        staffId: data.staffId,
        salary: data.salary,
        bonus: data.bonus,
        deductions: deductions,
        paidOn: data.paidOn
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
      data: payroll,
      message: "Payroll record created successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to create payroll record"
    };
  }
};

// Get payroll records with filters
export const getPayroll = async (filters: PayrollFilters & { page?: number; limit?: number } = {}): Promise<PaginatedResponse<any>> => {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const currentUser = authResult.user as any;
    const { page = 1, limit = 10, staffId, paidOn, search } = filters;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (staffId) {
      where.staffId = staffId;
    } else if (currentUser.role !== "ADMIN") {
      // Non-admin users can only see their own payroll
      where.staffId = currentUser.id;
    }

    if (paidOn) {
      where.paidOn = {
        gte: paidOn.start,
        lte: paidOn.end
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

    // Get payroll records with pagination
    const [payroll, total] = await Promise.all([
      prisma.payroll.findMany({
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
          paidOn: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.payroll.count({ where })
    ]);

    // Calculate net salary for each record
    const payrollWithNet = payroll.map(record => ({
      ...record,
      netSalary: record.salary + (record.bonus || 0) - (record.deductions || 0)
    }));

    return {
      success: true,
      data: payrollWithNet,
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
      message: e.message || "Failed to fetch payroll records"
    };
  }
};

// Get staff payroll history
export const getStaffPayroll = async (staffId: string, dateRange?: { start: Date; end: Date }): Promise<ApiResponse> => {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const currentUser = authResult.user as any;
    
    // Check permissions
    if (currentUser.id !== staffId && currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    const where: any = { staffId };

    if (dateRange) {
      where.paidOn = {
        gte: dateRange.start,
        lte: dateRange.end
      };
    }

    const payroll = await prisma.payroll.findMany({
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
        paidOn: 'desc'
      }
    });

    // Calculate net salary for each record
    const payrollWithNet = payroll.map(record => ({
      ...record,
      netSalary: record.salary + (record.bonus || 0) - (record.deductions || 0)
    }));

    return {
      success: true,
      data: payrollWithNet
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to fetch staff payroll"
    };
  }
};

// Update payroll record
export const updatePayroll = async (payrollId: string, data: UpdatePayrollData): Promise<ApiResponse> => {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const currentUser = authResult.user as any;
    
    if (currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId }
    });

    if (!payroll) {
      return {
        success: false,
        message: "Payroll record not found"
      };
    }

    const updatedPayroll = await prisma.payroll.update({
      where: { id: payrollId },
      data: {
        salary: data.salary ?? payroll.salary,
        bonus: data.bonus ?? payroll.bonus,
        deductions: data.deductions ?? payroll.deductions,
        paidOn: data.paidOn ?? payroll.paidOn
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
      data: updatedPayroll,
      message: "Payroll record updated successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to update payroll record"
    };
  }
};

// Delete payroll record
export const deletePayroll = async (payrollId: string): Promise<ApiResponse> => {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const currentUser = authResult.user as any;
    
    if (currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId }
    });

    if (!payroll) {
      return {
        success: false,
        message: "Payroll record not found"
      };
    }

    await prisma.payroll.delete({
      where: { id: payrollId }
    });

    return {
      success: true,
      message: "Payroll record deleted successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to delete payroll record"
    };
  }
};

// Calculate salary for a staff member
export const calculateSalary = async (staffId: string, period: string): Promise<ApiResponse> => {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const currentUser = authResult.user as any;
    
    // Check permissions
    if (currentUser.id !== staffId && currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    const staff = await prisma.staff.findUnique({
      where: { id: staffId }
    });

    if (!staff) {
      return {
        success: false,
        message: "Staff member not found"
      };
    }

    // Get base salary based on role (this would typically come from a salary configuration)
    const baseSalary = getBaseSalaryByRole(staff.role);

    // Get attendance for the period
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        staffId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const presentDays = attendance.filter(a => a.status === "Present" || a.status === "Checked Out").length;
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const workingDays = totalDays - Math.floor(totalDays / 7) * 2; // Subtract weekends

    // Calculate salary based on attendance
    const attendanceRate = presentDays / workingDays;
    const calculatedSalary = baseSalary * attendanceRate;

    // Calculate potential deductions (late arrivals, early departures, etc.)
    const deductions = 0; // This would be calculated based on specific rules

    // Calculate potential bonuses (overtime, performance, etc.)
    const bonus = 0; // This would be calculated based on specific rules

    return {
      success: true,
      data: {
        baseSalary,
        calculatedSalary,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        presentDays,
        workingDays,
        deductions,
        bonus,
        netSalary: calculatedSalary + bonus - deductions
      }
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to calculate salary"
    };
  }
};

// Generate payroll report
export const generatePayrollReport = async (filters: PayrollFilters = {}): Promise<ApiResponse> => {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const currentUser = authResult.user as any;
    
    if (currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions"
      };
    }

    const { staffId, paidOn, search } = filters;

    const where: any = {};

    if (staffId) {
      where.staffId = staffId;
    }

    if (paidOn) {
      where.paidOn = {
        gte: paidOn.start,
        lte: paidOn.end
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

    const payroll = await prisma.payroll.findMany({
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
        paidOn: 'desc'
      }
    });

    // Generate summary statistics
    const summary = {
      totalRecords: payroll.length,
      totalSalary: payroll.reduce((sum, record) => sum + record.salary, 0),
      totalBonus: payroll.reduce((sum, record) => sum + (record.bonus || 0), 0),
      totalDeductions: payroll.reduce((sum, record) => sum + (record.deductions || 0), 0),
      totalNetSalary: payroll.reduce((sum, record) => sum + record.salary + (record.bonus || 0) - (record.deductions || 0), 0),
      byRole: {} as Record<string, { count: number; totalSalary: number; totalNetSalary: number }>
    };

    // Calculate statistics by role
    payroll.forEach(record => {
      const role = record.staff.role;
      const netSalary = record.salary + (record.bonus || 0) - (record.deductions || 0);
      
      if (!summary.byRole[role]) {
        summary.byRole[role] = { count: 0, totalSalary: 0, totalNetSalary: 0 };
      }
      
      summary.byRole[role].count += 1;
      summary.byRole[role].totalSalary += record.salary;
      summary.byRole[role].totalNetSalary += netSalary;
    });

    return {
      success: true,
      data: {
        records: payroll,
        summary
      }
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to generate payroll report"
    };
  }
};

// Helper function to get base salary by role
function getBaseSalaryByRole(role: string): number {
  const salaryRanges = {
    'ADMIN': 50000,
    'VETERINARIAN': 40000,
    'WORKER': 25000
  };
  
  return salaryRanges[role as keyof typeof salaryRanges] || 25000;
}
