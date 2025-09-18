"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { AnalyticsFilters, ReportFilters, ApiResponse, DateRange } from "./types";

// Get staff overview analytics
export const getStaffOverview = async (dateRange?: DateRange): Promise<ApiResponse> => {
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

    const startDate = dateRange?.start || new Date(new Date().getFullYear(), 0, 1);
    const endDate = dateRange?.end || new Date();

    // Get staff statistics
    const [
      totalStaff,
      activeStaff,
      staffByRole,
      recentHires,
      staffTurnover
    ] = await Promise.all([
      prisma.staff.count(),
      prisma.staff.count({ where: { isActive: true } }),
      prisma.staff.groupBy({
        by: ['role'],
        where: { isActive: true },
        _count: { role: true }
      }),
      prisma.staff.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }),
      prisma.staff.count({
        where: {
          isActive: false,
          updatedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      })
    ]);

    // Get attendance statistics
    const attendanceStats = await prisma.attendance.groupBy({
      by: ['status'],
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: { status: true }
    });

    // Get leave statistics
    const leaveStats = await prisma.leaveRequest.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: { status: true }
    });

    const overview = {
      staff: {
        total: totalStaff,
        active: activeStaff,
        inactive: totalStaff - activeStaff,
        recentHires,
        turnover: staffTurnover,
        byRole: staffByRole.reduce((acc, item) => {
          acc[item.role] = item._count.role;
          return acc;
        }, {} as Record<string, number>)
      },
      attendance: {
        byStatus: attendanceStats.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>)
      },
      leave: {
        byStatus: leaveStats.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>)
      }
    };

    return {
      success: true,
      data: overview
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get staff overview"
    };
  }
};

// Get attendance analytics
export const getAttendanceAnalytics = async (filters: AnalyticsFilters = {}): Promise<ApiResponse> => {
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

    const { groupBy = 'month', staffId, dateRange } = filters;
    const startDate = dateRange?.start || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.end || new Date();

    const where: any = {
      date: {
        gte: startDate,
        lte: endDate
      }
    };

    if (staffId) {
      where.staffId = staffId;
    }

    // Get attendance data
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
        date: 'asc'
      }
    });

    // Group data by time period
    const groupedData = groupAttendanceByPeriod(attendance, groupBy);

    // Calculate statistics
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === "Present" || a.status === "Checked Out").length;
    const absentDays = attendance.filter(a => a.status === "Absent").length;
    const leaveDays = attendance.filter(a => a.status === "On Leave").length;

    const analytics = {
      summary: {
        totalDays,
        presentDays,
        absentDays,
        leaveDays,
        attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100 * 100) / 100 : 0
      },
      trends: groupedData,
      byRole: calculateAttendanceByRole(attendance),
      byStaff: calculateAttendanceByStaff(attendance)
    };

    return {
      success: true,
      data: analytics
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get attendance analytics"
    };
  }
};

// Get productivity metrics
export const getProductivityMetrics = async (staffId: string, period: string = 'month'): Promise<ApiResponse> => {
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
    let endDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
    }

    // Get staff data
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        role: true
      }
    });

    if (!staff) {
      return {
        success: false,
        message: "Staff member not found"
      };
    }

    // Get attendance data
    const attendance = await prisma.attendance.findMany({
      where: {
        staffId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Get leave data
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        staffId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Get work-related activities (treatments, etc.)
    const treatments = await prisma.treatments.count({
      where: {
        treatedById: staffId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });


    const mortalityRecords = await prisma.mortality.count({
      where: {
        recordedById: staffId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Calculate metrics
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const presentDays = attendance.filter(a => a.status === "Present" || a.status === "Checked Out").length;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    const productivity = {
      staff: {
        id: staff.id,
        name: staff.name,
        role: staff.role
      },
      period: {
        start: startDate,
        end: endDate,
        totalDays
      },
      attendance: {
        presentDays,
        attendanceRate: Math.round(attendanceRate * 100) / 100
      },
      activities: {
        treatments,
        mortalityRecords,
        totalActivities: treatments + mortalityRecords
      },
      leave: {
        totalRequests: leaveRequests.length,
        approvedRequests: leaveRequests.filter(r => r.status === 'APPROVED').length,
        pendingRequests: leaveRequests.filter(r => r.status === 'PENDING').length
      }
    };

    return {
      success: true,
      data: productivity
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get productivity metrics"
    };
  }
};

// Get leave analytics
export const getLeaveAnalytics = async (filters: AnalyticsFilters = {}): Promise<ApiResponse> => {
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

    const { groupBy = 'month', staffId, dateRange } = filters;
    const startDate = dateRange?.start || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.end || new Date();

    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    if (staffId) {
      where.staffId = staffId;
    }

    // Get leave data
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
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Group data by time period
    const groupedData = groupLeaveByPeriod(leaveRequests, groupBy);

    // Calculate statistics
    const totalRequests = leaveRequests.length;
    const approvedRequests = leaveRequests.filter(r => r.status === 'APPROVED').length;
    const pendingRequests = leaveRequests.filter(r => r.status === 'PENDING').length;
    const rejectedRequests = leaveRequests.filter(r => r.status === 'REJECTED').length;

    const analytics = {
      summary: {
        totalRequests,
        approvedRequests,
        pendingRequests,
        rejectedRequests,
        approvalRate: totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100 * 100) / 100 : 0
      },
      trends: groupedData,
      byLeaveType: calculateLeaveByType(leaveRequests),
      byRole: calculateLeaveByRole(leaveRequests),
      byStaff: calculateLeaveByStaff(leaveRequests)
    };

    return {
      success: true,
      data: analytics
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get leave analytics"
    };
  }
};

// Get payroll analytics
export const getPayrollAnalytics = async (filters: AnalyticsFilters = {}): Promise<ApiResponse> => {
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

    const { groupBy = 'month', staffId, dateRange } = filters;
    const startDate = dateRange?.start || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.end || new Date();

    const where: any = {
      paidOn: {
        gte: startDate,
        lte: endDate
      }
    };

    if (staffId) {
      where.staffId = staffId;
    }

    // Get payroll data
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
        paidOn: 'asc'
      }
    });

    // Group data by time period
    const groupedData = groupPayrollByPeriod(payroll, groupBy);

    // Calculate statistics
    const totalSalary = payroll.reduce((sum, record) => sum + record.salary, 0);
    const totalBonus = payroll.reduce((sum, record) => sum + (record.bonus || 0), 0);
    const totalDeductions = payroll.reduce((sum, record) => sum + (record.deductions || 0), 0);
    const totalNetSalary = totalSalary + totalBonus - totalDeductions;

    const analytics = {
      summary: {
        totalRecords: payroll.length,
        totalSalary,
        totalBonus,
        totalDeductions,
        totalNetSalary,
        averageSalary: payroll.length > 0 ? Math.round(totalSalary / payroll.length * 100) / 100 : 0
      },
      trends: groupedData,
      byRole: calculatePayrollByRole(payroll),
      byStaff: calculatePayrollByStaff(payroll)
    };

    return {
      success: true,
      data: analytics
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get payroll analytics"
    };
  }
};

// Export staff report
export const exportStaffReport = async (filters: ReportFilters = {}, format: 'pdf' | 'excel' = 'excel'): Promise<ApiResponse> => {
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

    const { dateRange, search, role } = filters;
    const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.end || new Date();

    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get staff data
    const staff = await prisma.staff.findMany({
      where,
      include: {
        attendance: {
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        leaveRequests: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        payrolls: {
          where: {
            paidOn: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Generate report data
    const reportData = staff.map(member => {
      const presentDays = member.attendance.filter(a => a.status === "Present" || a.status === "Checked Out").length;
      const totalAttendance = member.attendance.length;
      const attendanceRate = totalAttendance > 0 ? Math.round((presentDays / totalAttendance) * 100 * 100) / 100 : 0;

      const approvedLeaves = member.leaveRequests.filter(r => r.status === 'APPROVED').length;
      const totalSalary = member.payrolls.reduce((sum, p) => sum + p.salary, 0);
      const totalBonus = member.payrolls.reduce((sum, p) => sum + (p.bonus || 0), 0);
      const totalDeductions = member.payrolls.reduce((sum, p) => sum + (p.deductions || 0), 0);

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        isActive: member.isActive,
        createdAt: member.createdAt,
        attendanceRate,
        approvedLeaves,
        totalSalary,
        totalBonus,
        totalDeductions,
        netSalary: totalSalary + totalBonus - totalDeductions
      };
    });

    // In a real implementation, you would generate the actual file here
    // For now, we'll return the data that would be used to generate the report
    return {
      success: true,
      data: {
        format,
        generatedAt: new Date(),
        dateRange: { start: startDate, end: endDate },
        totalRecords: reportData.length,
        data: reportData
      },
      message: `Report generated successfully. ${reportData.length} records included.`
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to export staff report"
    };
  }
};

// Helper functions for data grouping and calculations

function groupAttendanceByPeriod(attendance: any[], groupBy: string) {
  const groups: Record<string, any> = {};
  
  attendance.forEach(record => {
    const date = new Date(record.date);
    let key: string;
    
    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        key = String(date.getFullYear());
        break;
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (!groups[key]) {
      groups[key] = { present: 0, absent: 0, leave: 0, total: 0 };
    }
    
    groups[key].total++;
    if (record.status === "Present" || record.status === "Checked Out") {
      groups[key].present++;
    } else if (record.status === "Absent") {
      groups[key].absent++;
    } else if (record.status === "On Leave") {
      groups[key].leave++;
    }
  });
  
  return groups;
}

function groupLeaveByPeriod(leaveRequests: any[], groupBy: string) {
  const groups: Record<string, any> = {};
  
  leaveRequests.forEach(record => {
    const date = new Date(record.createdAt);
    let key: string;
    
    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        key = String(date.getFullYear());
        break;
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (!groups[key]) {
      groups[key] = { approved: 0, pending: 0, rejected: 0, total: 0 };
    }
    
    groups[key].total++;
    groups[key][record.status.toLowerCase()]++;
  });
  
  return groups;
}

function groupPayrollByPeriod(payroll: any[], groupBy: string) {
  const groups: Record<string, any> = {};
  
  payroll.forEach(record => {
    const date = new Date(record.paidOn);
    let key: string;
    
    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        key = String(date.getFullYear());
        break;
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (!groups[key]) {
      groups[key] = { totalSalary: 0, totalBonus: 0, totalDeductions: 0, count: 0 };
    }
    
    groups[key].count++;
    groups[key].totalSalary += record.salary;
    groups[key].totalBonus += record.bonus || 0;
    groups[key].totalDeductions += record.deductions || 0;
  });
  
  return groups;
}

function calculateAttendanceByRole(attendance: any[]) {
  const byRole: Record<string, any> = {};
  
  attendance.forEach(record => {
    const role = record.staff.role;
    if (!byRole[role]) {
      byRole[role] = { present: 0, absent: 0, leave: 0, total: 0 };
    }
    
    byRole[role].total++;
    if (record.status === "Present" || record.status === "Checked Out") {
      byRole[role].present++;
    } else if (record.status === "Absent") {
      byRole[role].absent++;
    } else if (record.status === "On Leave") {
      byRole[role].leave++;
    }
  });
  
  return byRole;
}

function calculateAttendanceByStaff(attendance: any[]) {
  const byStaff: Record<string, any> = {};
  
  attendance.forEach(record => {
    const staffId = record.staffId;
    if (!byStaff[staffId]) {
      byStaff[staffId] = {
        staff: record.staff,
        present: 0,
        absent: 0,
        leave: 0,
        total: 0
      };
    }
    
    byStaff[staffId].total++;
    if (record.status === "Present" || record.status === "Checked Out") {
      byStaff[staffId].present++;
    } else if (record.status === "Absent") {
      byStaff[staffId].absent++;
    } else if (record.status === "On Leave") {
      byStaff[staffId].leave++;
    }
  });
  
  return byStaff;
}

function calculateLeaveByType(leaveRequests: any[]) {
  const byType: Record<string, number> = {};
  
  leaveRequests.forEach(record => {
    byType[record.leaveType] = (byType[record.leaveType] || 0) + 1;
  });
  
  return byType;
}

function calculateLeaveByRole(leaveRequests: any[]) {
  const byRole: Record<string, any> = {};
  
  leaveRequests.forEach(record => {
    const role = record.staff.role;
    if (!byRole[role]) {
      byRole[role] = { approved: 0, pending: 0, rejected: 0, total: 0 };
    }
    
    byRole[role].total++;
    byRole[role][record.status.toLowerCase()]++;
  });
  
  return byRole;
}

function calculateLeaveByStaff(leaveRequests: any[]) {
  const byStaff: Record<string, any> = {};
  
  leaveRequests.forEach(record => {
    const staffId = record.staffId;
    if (!byStaff[staffId]) {
      byStaff[staffId] = {
        staff: record.staff,
        approved: 0,
        pending: 0,
        rejected: 0,
        total: 0
      };
    }
    
    byStaff[staffId].total++;
    byStaff[staffId][record.status.toLowerCase()]++;
  });
  
  return byStaff;
}

function calculatePayrollByRole(payroll: any[]) {
  const byRole: Record<string, any> = {};
  
  payroll.forEach(record => {
    const role = record.staff.role;
    if (!byRole[role]) {
      byRole[role] = { totalSalary: 0, totalBonus: 0, totalDeductions: 0, count: 0 };
    }
    
    byRole[role].count++;
    byRole[role].totalSalary += record.salary;
    byRole[role].totalBonus += record.bonus || 0;
    byRole[role].totalDeductions += record.deductions || 0;
  });
  
  return byRole;
}

function calculatePayrollByStaff(payroll: any[]) {
  const byStaff: Record<string, any> = {};
  
  payroll.forEach(record => {
    const staffId = record.staffId;
    if (!byStaff[staffId]) {
      byStaff[staffId] = {
        staff: record.staff,
        totalSalary: 0,
        totalBonus: 0,
        totalDeductions: 0,
        count: 0
      };
    }
    
    byStaff[staffId].count++;
    byStaff[staffId].totalSalary += record.salary;
    byStaff[staffId].totalBonus += record.bonus || 0;
    byStaff[staffId].totalDeductions += record.deductions || 0;
  });
  
  return byStaff;
}
