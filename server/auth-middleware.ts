"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ApiResponse } from "./types";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  isActive?: boolean;
}

// Get authenticated user session
export const getAuthenticatedUser = async (): Promise<{ success: boolean; user?: AuthenticatedUser; message?: string }> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const user = session.user as AuthenticatedUser;
    return {
      success: true,
      user
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to authenticate user"
    };
  }
};

// Check if user has admin role
export const requireAdmin = async (): Promise<{ success: boolean; user?: AuthenticatedUser; message?: string }> => {
  const authResult = await getAuthenticatedUser();
  
  if (!authResult.success) {
    return authResult;
  }

  if (authResult.user?.role !== "ADMIN") {
    return {
      success: false,
      message: "Admin access required"
    };
  }

  return authResult;
};

// Check if user can access resource (own data or admin)
export const canAccessResource = async (resourceUserId: string): Promise<{ success: boolean; user?: AuthenticatedUser; message?: string }> => {
  const authResult = await getAuthenticatedUser();
  
  if (!authResult.success) {
    return authResult;
  }

  const currentUser = authResult.user!;
  
  if (currentUser.id !== resourceUserId && currentUser.role !== "ADMIN") {
    return {
      success: false,
      message: "Insufficient permissions"
    };
  }

  return authResult;
};

// Check if user has specific role
export const requireRole = async (allowedRoles: string[]): Promise<{ success: boolean; user?: AuthenticatedUser; message?: string }> => {
  const authResult = await getAuthenticatedUser();
  
  if (!authResult.success) {
    return authResult;
  }

  if (!allowedRoles.includes(authResult.user!.role)) {
    return {
      success: false,
      message: `Access denied. Required roles: ${allowedRoles.join(", ")}`
    };
  }

  return authResult;
};

// Wrapper for API functions that require authentication
export const withAuth = async <T>(
  handler: (user: AuthenticatedUser) => Promise<ApiResponse<T>>
): Promise<ApiResponse<T>> => {
  const authResult = await getAuthenticatedUser();
  
  if (!authResult.success) {
    return {
      success: false,
      message: authResult.message || "Authentication required"
    };
  }

  return handler(authResult.user!);
};

// Wrapper for API functions that require admin access
export const withAdminAuth = async <T>(
  handler: (user: AuthenticatedUser) => Promise<ApiResponse<T>>
): Promise<ApiResponse<T>> => {
  const authResult = await requireAdmin();
  
  if (!authResult.success) {
    return {
      success: false,
      message: authResult.message || "Admin access required"
    };
  }

  return handler(authResult.user!);
};

// Wrapper for API functions that require resource access
export const withResourceAccess = async <T>(
  resourceUserId: string,
  handler: (user: AuthenticatedUser) => Promise<ApiResponse<T>>
): Promise<ApiResponse<T>> => {
  const authResult = await canAccessResource(resourceUserId);
  
  if (!authResult.success) {
    return {
      success: false,
      message: authResult.message || "Insufficient permissions"
    };
  }

  return handler(authResult.user!);
};

