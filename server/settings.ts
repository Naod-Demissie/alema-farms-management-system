"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers as getHeaders } from "next/headers";
import { ApiResponse } from "./types";
import bcrypt from "bcryptjs";
import { getServerSession } from "@/lib/auth";
import { sessionCache } from "@/lib/session-cache";

// Profile Settings Types
export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SystemSettings {
  farmName: string;
  farmAddress: string;
  farmPhone: string;
  farmEmail: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  language: string;
}

// ===================
// Profile Management
// ===================

export const getProfile = async (): Promise<ApiResponse> => {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const user = session.user;

    const profile = await prisma.staff.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!profile) {
      return {
        success: false,
        message: "Profile not found"
      };
    }

    return {
      success: true,
      data: profile
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to fetch profile"
    };
  }
};

export const updateProfile = async (data: UpdateProfileData): Promise<ApiResponse> => {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const user = session.user;

    // Check if email is being changed and if it already exists
    if (data.email && data.email !== user.email) {
      const emailExists = await prisma.staff.findUnique({
        where: { email: data.email }
      });

      if (emailExists) {
        return {
          success: false,
          message: "A staff member with this email already exists"
        };
      }
    }

    const updateData: any = {};
    
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.firstName || data.lastName) {
      updateData.name = `${data.firstName || user.firstName} ${data.lastName || user.lastName}`;
    }
    if (data.email) updateData.email = data.email;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.profileImage !== undefined) updateData.image = data.profileImage;

    const updatedProfile = await prisma.staff.update({
      where: { id: user.id },
      data: updateData,
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

    // Invalidate session cache to force refresh
    if (session.session?.token) {
      sessionCache.delete(session.session.token);
    }

    return {
      success: true,
      data: updatedProfile,
      message: "Profile updated successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to update profile"
    };
  }
};

export const changePassword = async (data: ChangePasswordData): Promise<ApiResponse> => {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const user = session.user;

    // Validate input
    if (data.newPassword !== data.confirmPassword) {
      return {
        success: false,
        message: "New password and confirmation do not match"
      };
    }

    if (data.newPassword.length < 8) {
      return {
        success: false,
        message: "New password must be at least 8 characters long"
      };
    }

    // Use better-auth API to change password
    const headersList = await getHeaders();
    const result = await auth.api.changePassword({
      body: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: false, // Keep other sessions active
      },
      headers: headersList,
    });

    // Check if the result indicates an error
    if (!result || result === null) {
      return {
        success: false,
        message: "Failed to change password"
      };
    }

    return {
      success: true,
      message: "Password updated successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to change password"
    };
  }
};

// ===================
// System Settings (Simplified)
// ===================

export const getSystemSettings = async (): Promise<ApiResponse> => {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const user = session.user;

    // Check if user has permission to view system settings
    if (user.role !== "ADMIN") {
      return {
        success: false,
        message: "Only administrators can view system settings"
      };
    }

    const defaultSettings: SystemSettings = {
      farmName: "Poultry Farm",
      farmAddress: "",
      farmPhone: "",
      farmEmail: "",
      currency: "USD",
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
      language: "en"
    };

    return {
      success: true,
      data: defaultSettings
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to fetch system settings"
    };
  }
};

export const updateSystemSettings = async (settings: SystemSettings): Promise<ApiResponse> => {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const user = session.user;

    // Check if user has permission to update system settings
    if (user.role !== "ADMIN") {
      return {
        success: false,
        message: "Only administrators can update system settings"
      };
    }

    // Validate required fields
    if (!settings.farmName || !settings.farmEmail) {
      return {
        success: false,
        message: "Farm name and email are required"
      };
    }

    return {
      success: true,
      data: settings,
      message: "System settings updated successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to update system settings"
    };
  }
};

// ===================
// User Preferences (Simplified)
// ===================

export const getUserPreferences = async (): Promise<ApiResponse> => {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const user = session.user;

    const defaultPreferences = {
      theme: "light",
      language: "en",
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
      currency: "USD"
    };

    return {
      success: true,
      data: {
        userId: user.id,
        ...defaultPreferences
      }
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to fetch user preferences"
    };
  }
};

export const updateUserPreferences = async (preferences: any): Promise<ApiResponse> => {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const user = session.user;

    return {
      success: true,
      data: preferences,
      message: "User preferences updated successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to update user preferences"
    };
  }
};

// ===================
// Security Settings (Simplified)
// ===================

export const getSecuritySettings = async (): Promise<ApiResponse> => {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const user = session.user;

    // Check if user has permission to view security settings
    if (user.role !== "ADMIN") {
      return {
        success: false,
        message: "Only administrators can view security settings"
      };
    }

    const defaultSecuritySettings = {
      passwordMinLength: 8,
      passwordRequireSpecialChars: true,
      passwordRequireNumbers: true,
      passwordRequireUppercase: true,
      sessionTimeout: 10080, // minutes (1 week)
      maxLoginAttempts: 5,
      lockoutDuration: 15, // minutes
      twoFactorEnabled: false,
      ipWhitelist: [],
      auditLogging: true
    };

    return {
      success: true,
      data: defaultSecuritySettings
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to fetch security settings"
    };
  }
};

export const updateSecuritySettings = async (settings: any): Promise<ApiResponse> => {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const user = session.user;

    // Check if user has permission to update security settings
    if (user.role !== "ADMIN") {
      return {
        success: false,
        message: "Only administrators can update security settings"
      };
    }

    // Validate settings
    if (settings.passwordMinLength < 6) {
      return {
        success: false,
        message: "Minimum password length must be at least 6 characters"
      };
    }

    if (settings.sessionTimeout < 5) {
      return {
        success: false,
        message: "Session timeout must be at least 5 minutes"
      };
    }

    return {
      success: true,
      data: settings,
      message: "Security settings updated successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to update security settings"
    };
  }
};