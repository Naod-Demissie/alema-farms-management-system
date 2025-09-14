"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { AuditFilters, ApiResponse, PaginatedResponse } from "./types";

// Log action
export const logAction = async (action: string, staffId: string, details: any): Promise<ApiResponse> => {
  try {
    // In a real implementation, you would have an audit_logs table
    // For now, we'll just log to console and return success
    
    const auditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      staffId,
      details,
      timestamp: new Date(),
      ipAddress: 'unknown', // Would be extracted from request headers
      userAgent: 'unknown'  // Would be extracted from request headers
    };

    // Log to console (in production, this would go to a proper logging service)
    console.log('AUDIT LOG:', JSON.stringify(auditLog, null, 2));

    // In a real implementation, you would save to database:
    // await prisma.auditLog.create({ data: auditLog });

    return {
      success: true,
      data: auditLog,
      message: "Action logged successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to log action"
    };
  }
};

// Get audit logs
export const getAuditLogs = async (filters: AuditFilters = {}): Promise<PaginatedResponse<any>> => {
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

    const { page = 1, limit = 10, action, staffId, dateRange, search } = filters;
    const offset = (page - 1) * limit;

    // In a real implementation, you would query the audit_logs table
    // For now, we'll return mock data

    const mockAuditLogs = [
      {
        id: 'audit_1',
        action: 'STAFF_CREATED',
        staffId: 'staff_1',
        staffName: 'John Doe',
        details: { firstName: 'John', lastName: 'Doe', role: 'WORKER' },
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...'
      },
      {
        id: 'audit_2',
        action: 'LEAVE_APPROVED',
        staffId: 'staff_2',
        staffName: 'Jane Smith',
        details: { leaveId: 'leave_1', leaveType: 'ANNUAL', days: 5 },
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0...'
      },
      {
        id: 'audit_3',
        action: 'PAYROLL_CREATED',
        staffId: 'staff_1',
        staffName: 'John Doe',
        details: { payrollId: 'payroll_1', amount: 2500, period: '2024-01' },
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...'
      }
    ];

    // Apply filters (mock implementation)
    let filteredLogs = mockAuditLogs;

    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action.includes(action));
    }

    if (staffId) {
      filteredLogs = filteredLogs.filter(log => log.staffId === staffId);
    }

    if (dateRange) {
      filteredLogs = filteredLogs.filter(log => 
        log.timestamp >= dateRange.start && log.timestamp <= dateRange.end
      );
    }

    if (search) {
      filteredLogs = filteredLogs.filter(log => 
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.staffName.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply pagination
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);

    return {
      success: true,
      data: paginatedLogs,
      pagination: {
        page,
        limit,
        total: filteredLogs.length,
        totalPages: Math.ceil(filteredLogs.length / limit)
      }
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to fetch audit logs"
    };
  }
};

// Export audit logs
export const exportAuditLogs = async (filters: AuditFilters = {}): Promise<ApiResponse> => {
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

    // Get all audit logs (without pagination for export)
    const allLogsResult = await getAuditLogs({ ...filters, page: 1, limit: 10000 });
    
    if (!allLogsResult.success) {
      return allLogsResult;
    }

    const logs = allLogsResult.data || [];

    // Generate export data
    const exportData = {
      generatedAt: new Date(),
      totalRecords: logs.length,
      filters: filters,
      data: logs.map(log => ({
        timestamp: log.timestamp,
        action: log.action,
        staffId: log.staffId,
        staffName: log.staffName,
        details: JSON.stringify(log.details),
        ipAddress: log.ipAddress,
        userAgent: log.userAgent
      }))
    };

    return {
      success: true,
      data: exportData,
      message: `Audit logs exported successfully. ${logs.length} records included.`
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to export audit logs"
    };
  }
};

// Get audit statistics
export const getAuditStatistics = async (dateRange?: { start: Date; end: Date }): Promise<ApiResponse> => {
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

    // In a real implementation, you would query the audit_logs table
    // For now, we'll return mock statistics

    const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.end || new Date();

    const mockStats = {
      totalActions: 150,
      uniqueUsers: 12,
      topActions: [
        { action: 'STAFF_LOGIN', count: 45 },
        { action: 'ATTENDANCE_CHECKIN', count: 30 },
        { action: 'LEAVE_CREATED', count: 20 },
        { action: 'PAYROLL_VIEWED', count: 15 },
        { action: 'STAFF_UPDATED', count: 10 }
      ],
      actionsByDay: [
        { date: '2024-01-01', count: 5 },
        { date: '2024-01-02', count: 8 },
        { date: '2024-01-03', count: 12 },
        // ... more data
      ],
      actionsByUser: [
        { staffId: 'staff_1', staffName: 'John Doe', count: 25 },
        { staffId: 'staff_2', staffName: 'Jane Smith', count: 20 },
        { staffId: 'staff_3', staffName: 'Bob Wilson', count: 15 }
      ],
      dateRange: {
        start: startDate,
        end: endDate
      }
    };

    return {
      success: true,
      data: mockStats
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get audit statistics"
    };
  }
};

// Get user activity summary
export const getUserActivitySummary = async (staffId: string, dateRange?: { start: Date; end: Date }): Promise<ApiResponse> => {
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

    // In a real implementation, you would query the audit_logs table
    // For now, we'll return mock data

    const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.end || new Date();

    const mockActivity = {
      staffId,
      totalActions: 45,
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      actionsByType: [
        { action: 'STAFF_LOGIN', count: 15 },
        { action: 'ATTENDANCE_CHECKIN', count: 10 },
        { action: 'LEAVE_CREATED', count: 5 },
        { action: 'PAYROLL_VIEWED', count: 8 },
        { action: 'PROFILE_UPDATED', count: 2 }
      ],
      recentActions: [
        {
          action: 'ATTENDANCE_CHECKIN',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          details: { location: 'Main Office' }
        },
        {
          action: 'LEAVE_CREATED',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          details: { leaveType: 'ANNUAL', days: 3 }
        }
      ],
      dateRange: {
        start: startDate,
        end: endDate
      }
    };

    return {
      success: true,
      data: mockActivity
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get user activity summary"
    };
  }
};

// Clean up old audit logs
export const cleanupAuditLogs = async (olderThanDays: number = 90): Promise<ApiResponse> => {
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

    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

    // In a real implementation, you would delete old audit logs:
    // const deletedCount = await prisma.auditLog.deleteMany({
    //   where: {
    //     timestamp: {
    //       lt: cutoffDate
    //     }
    //   }
    // });

    // For now, we'll return a mock result
    const deletedCount = 1250; // Mock count

    return {
      success: true,
      data: { deletedCount, cutoffDate },
      message: `Cleaned up ${deletedCount} audit logs older than ${olderThanDays} days`
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to cleanup audit logs"
    };
  }
};
