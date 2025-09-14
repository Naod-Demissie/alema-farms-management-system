"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ApiResponse } from "./types";

// Define permissions for each role
const ROLE_PERMISSIONS = {
  ADMIN: [
    'staff:read',
    'staff:create',
    'staff:update',
    'staff:delete',
    'attendance:read',
    'attendance:create',
    'attendance:update',
    'attendance:delete',
    'payroll:read',
    'payroll:create',
    'payroll:update',
    'payroll:delete',
    'leave:read',
    'leave:create',
    'leave:update',
    'leave:approve',
    'leave:reject',
    'notifications:read',
    'notifications:create',
    'notifications:send',
    'analytics:read',
    'reports:generate',
    'invites:create',
    'invites:manage',
    'permissions:manage'
  ],
  VETERINARIAN: [
    'staff:read',
    'attendance:read',
    'attendance:create',
    'payroll:read',
    'leave:read',
    'leave:create',
    'notifications:read',
    'notifications:create',
    'flocks:read',
    'flocks:update',
    'health:read',
    'health:create',
    'health:update',
    'treatments:read',
    'treatments:create',
    'treatments:update',
    'vaccinations:read',
    'vaccinations:create',
    'vaccinations:update'
  ],
  WORKER: [
    'attendance:read',
    'attendance:create',
    'payroll:read',
    'leave:read',
    'leave:create',
    'notifications:read',
    'flocks:read',
    'health:read',
    'health:create',
    'treatments:read',
    'treatments:create',
    'vaccinations:read',
    'vaccinations:create'
  ]
};

// Get user permissions
export const getUserPermissions = async (staffId: string): Promise<ApiResponse> => {
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

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { id: true, role: true, isActive: true }
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
        message: "Staff account is inactive"
      };
    }

    const permissions = ROLE_PERMISSIONS[staff.role as keyof typeof ROLE_PERMISSIONS] || [];

    return {
      success: true,
      data: {
        staffId: staff.id,
        role: staff.role,
        permissions,
        isActive: staff.isActive
      }
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get user permissions"
    };
  }
};

// Change staff role
export const changeStaffRole = async (staffId: string, newRole: string, changedBy: string): Promise<ApiResponse> => {
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
        message: "Insufficient permissions to change roles"
      };
    }

    // Validate new role
    if (!['ADMIN', 'VETERINARIAN', 'WORKER'].includes(newRole)) {
      return {
        success: false,
        message: "Invalid role specified"
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

    // Prevent changing own role
    if (currentUser.id === staffId) {
      return {
        success: false,
        message: "Cannot change your own role"
      };
    }

    // Update staff role
    const updatedStaff = await prisma.staff.update({
      where: { id: staffId },
      data: {
        role: newRole,
        isSystemUser: newRole !== 'WORKER'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        role: true,
        isSystemUser: true,
        isActive: true
      }
    });

    // Log the role change
    await logAction('ROLE_CHANGED', changedBy, {
      staffId,
      oldRole: staff.role,
      newRole,
      changedBy
    });

    return {
      success: true,
      data: updatedStaff,
      message: "Staff role updated successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to change staff role"
    };
  }
};

// Get available roles
export const getAvailableRoles = async (): Promise<ApiResponse> => {
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

    const roles = [
      {
        value: 'ADMIN',
        label: 'Administrator',
        description: 'Full system access and management capabilities',
        permissions: ROLE_PERMISSIONS.ADMIN.length
      },
      {
        value: 'VETERINARIAN',
        label: 'Veterinarian',
        description: 'Health monitoring and treatment management',
        permissions: ROLE_PERMISSIONS.VETERINARIAN.length
      },
      {
        value: 'WORKER',
        label: 'Worker',
        description: 'Basic operational tasks and data entry',
        permissions: ROLE_PERMISSIONS.WORKER.length
      }
    ];

    return {
      success: true,
      data: roles
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get available roles"
    };
  }
};

// Check specific permission
export const checkPermission = async (staffId: string, permission: string): Promise<ApiResponse> => {
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

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { role: true, isActive: true }
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
        data: { hasPermission: false },
        message: "Staff account is inactive"
      };
    }

    const permissions = ROLE_PERMISSIONS[staff.role as keyof typeof ROLE_PERMISSIONS] || [];
    const hasPermission = permissions.includes(permission);

    return {
      success: true,
      data: { hasPermission }
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to check permission"
    };
  }
};

// Get role permissions
export const getRolePermissions = async (role: string): Promise<ApiResponse> => {
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

    if (!['ADMIN', 'VETERINARIAN', 'WORKER'].includes(role)) {
      return {
        success: false,
        message: "Invalid role specified"
      };
    }

    const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];

    // Group permissions by category
    const groupedPermissions = permissions.reduce((acc, permission) => {
      const [category] = permission.split(':');
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    }, {} as Record<string, string[]>);

    return {
      success: true,
      data: {
        role,
        permissions,
        groupedPermissions
      }
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get role permissions"
    };
  }
};

// Check if user can perform action
export const canPerformAction = async (staffId: string, action: string): Promise<boolean> => {
  try {
    const permissionResult = await checkPermission(staffId, action);
    return permissionResult.success && permissionResult.data?.hasPermission;
  } catch (error) {
    return false;
  }
};

// Get staff with their permissions summary
export const getStaffWithPermissions = async (): Promise<ApiResponse> => {
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

    const staff = await prisma.staff.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const staffWithPermissions = staff.map(member => ({
      ...member,
      permissions: ROLE_PERMISSIONS[member.role as keyof typeof ROLE_PERMISSIONS] || [],
      permissionCount: ROLE_PERMISSIONS[member.role as keyof typeof ROLE_PERMISSIONS]?.length || 0
    }));

    return {
      success: true,
      data: staffWithPermissions
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get staff with permissions"
    };
  }
};

// Validate access to resource
export const validateAccess = async (staffId: string, resource: string, action: string): Promise<ApiResponse> => {
  try {
    const permission = `${resource}:${action}`;
    const hasPermission = await canPerformAction(staffId, permission);

    if (!hasPermission) {
      return {
        success: false,
        message: `Access denied. Required permission: ${permission}`
      };
    }

    return {
      success: true,
      message: "Access granted"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to validate access"
    };
  }
};

// Helper function to log actions (placeholder - would need audit table)
async function logAction(action: string, staffId: string, details: any) {
  // This would typically log to an audit table
  console.log(`Action: ${action}, Staff: ${staffId}, Details:`, details);
}
