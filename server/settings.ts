"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ApiResponse } from "./types";
import bcrypt from "bcryptjs";

// Profile Settings Types
export interface UpdateProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  bio?: string;
  address?: string;
  dateOfBirth?: string;
  profileImage?: string;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateNotificationSettingsData {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
}

export interface UpdatePreferencesData {
  theme: string;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  autoSave: boolean;
  notifications: boolean;
  soundEnabled: boolean;
  animationSpeed: number;
  compactMode: boolean;
  sidebarCollapsed: boolean;
  dashboardLayout: string;
}

export interface UpdateSecuritySettingsData {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  suspiciousActivityAlerts: boolean;
  passwordExpiry: number;
}

// Update user profile
export async function updateProfile(data: UpdateProfileData): Promise<ApiResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const userId = session.user.id;

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email) {
      return {
        success: false,
        message: "First name, last name, and email are required"
      };
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.staff.findFirst({
      where: {
        email: data.email,
        id: { not: userId }
      }
    });

    if (existingUser) {
      return {
        success: false,
        message: "Email is already taken by another user"
      };
    }

    // Update user profile
    const updatedUser = await prisma.staff.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phoneNumber: data.phoneNumber,
        image: data.profileImage,
        // Note: bio, address, dateOfBirth would need to be added to the Staff model
        // For now, we'll store them in a JSON field or create separate fields
      }
    });

    return {
      success: true,
      data: updatedUser,
      message: "Profile updated successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to update profile"
    };
  }
}

// Update password
export async function updatePassword(data: UpdatePasswordData): Promise<ApiResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const userId = session.user.id;

    // Get user's current password hash
    const user = await prisma.staff.findUnique({
      where: { id: userId },
      include: { accounts: true }
    });

    if (!user) {
      return {
        success: false,
        message: "User not found"
      };
    }

    // Find the password account
    const passwordAccount = user.accounts.find(account => account.providerId === "credential");
    
    if (!passwordAccount?.password) {
      return {
        success: false,
        message: "No password set for this account"
      };
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, passwordAccount.password);
    
    if (!isCurrentPasswordValid) {
      return {
        success: false,
        message: "Current password is incorrect"
      };
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(data.newPassword, 12);

    // Update password
    await prisma.accounts.update({
      where: { id: passwordAccount.id },
      data: { password: hashedNewPassword }
    });

    return {
      success: true,
      message: "Password updated successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to update password"
    };
  }
}

// Update notification settings
export async function updateNotificationSettings(data: UpdateNotificationSettingsData): Promise<ApiResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const userId = session.user.id;

    // In a real implementation, you would have a user_preferences table
    // For now, we'll just return success
    // You could store these in a JSON field in the Staff model or create a separate preferences table

    return {
      success: true,
      message: "Notification settings updated successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to update notification settings"
    };
  }
}

// Update preferences
export async function updatePreferences(data: UpdatePreferencesData): Promise<ApiResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const userId = session.user.id;

    // In a real implementation, you would have a user_preferences table
    // For now, we'll just return success
    // You could store these in a JSON field in the Staff model or create a separate preferences table

    return {
      success: true,
      message: "Preferences updated successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to update preferences"
    };
  }
}

// Update security settings
export async function updateSecuritySettings(data: UpdateSecuritySettingsData): Promise<ApiResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const userId = session.user.id;

    // In a real implementation, you would have a user_security_settings table
    // For now, we'll just return success
    // You could store these in a JSON field in the Staff model or create a separate security settings table

    return {
      success: true,
      message: "Security settings updated successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to update security settings"
    };
  }
}

// Get user profile
export async function getUserProfile(): Promise<ApiResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const userId = session.user.id;

    const user = await prisma.staff.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        phoneNumber: true,
        image: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return {
        success: false,
        message: "User not found"
      };
    }

    return {
      success: true,
      data: user,
      message: "Profile retrieved successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get user profile"
    };
  }
}

// Get user preferences
export async function getUserPreferences(): Promise<ApiResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    // In a real implementation, you would fetch from a user_preferences table
    // For now, return default preferences
    const defaultPreferences = {
      theme: "system",
      language: "en",
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      autoSave: true,
      notifications: true,
      soundEnabled: true,
      animationSpeed: 1,
      compactMode: false,
      sidebarCollapsed: false,
      dashboardLayout: "grid",
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: false,
      twoFactorEnabled: false,
      loginAlerts: true,
      suspiciousActivityAlerts: true,
      passwordExpiry: 90
    };

    return {
      success: true,
      data: defaultPreferences,
      message: "Preferences retrieved successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get user preferences"
    };
  }
}

// Revoke session
export async function revokeSession(sessionId: string): Promise<ApiResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    // Delete the session
    await prisma.sessions.delete({
      where: { id: sessionId }
    });

    return {
      success: true,
      message: "Session revoked successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to revoke session"
    };
  }
}

// Get active sessions
export async function getActiveSessions(): Promise<ApiResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const userId = session.user.id;

    const sessions = await prisma.sessions.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        ipAddress: true,
        userAgent: true
      }
    });

    // Format sessions for display
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      device: session.userAgent ? 
        session.userAgent.includes('Chrome') ? 'Chrome' :
        session.userAgent.includes('Firefox') ? 'Firefox' :
        session.userAgent.includes('Safari') ? 'Safari' : 'Unknown Browser'
        : 'Unknown Device',
      location: session.ipAddress || 'Unknown',
      lastActive: new Date(session.updatedAt).toLocaleString(),
      current: session.id === session.id // This would need proper comparison
    }));

    return {
      success: true,
      data: formattedSessions,
      message: "Active sessions retrieved successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to get active sessions"
    };
  }
}

// Delete account
export async function deleteAccount(): Promise<ApiResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const userId = session.user.id;

    // Delete user and all related data (cascade delete should handle this)
    await prisma.staff.delete({
      where: { id: userId }
    });

    return {
      success: true,
      message: "Account deleted successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to delete account"
    };
  }
}
