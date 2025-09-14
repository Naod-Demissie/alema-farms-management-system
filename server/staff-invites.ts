"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { randomBytes } from "crypto";
import { CreateInviteData, InviteVerificationData, ApiResponse } from "./types";
import { sendInviteEmail } from "./email";
import { createStaffSchema } from "@/features/staff/data/schema";

// Create non-system staff member directly (for workers)
export const createNonSystemStaff = async (data: any): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    // Check if user has permission to create staff
    const currentUser = session.user as any;
    if (currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions to create staff"
      };
    }

    // Validate input data
    const validatedData = createStaffSchema.parse(data);

    // Check if staff member already exists (by name and phone if no email)
    const existingStaff = await prisma.staff.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { 
            AND: [
              { firstName: validatedData.firstName },
              { lastName: validatedData.lastName },
              { phoneNumber: validatedData.phoneNumber }
            ]
          }
        ]
      }
    });

    if (existingStaff) {
      return {
        success: false,
        message: "A staff member with this information already exists"
      };
    }

    // Create staff member directly in database
    const staff = await prisma.staff.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        name: `${validatedData.firstName} ${validatedData.lastName}`,
        email: validatedData.email || null,
        emailVerified: false,
        phoneNumber: validatedData.phoneNumber || null,
        role: validatedData.role,
        isSystemUser: false, // Non-system user
        isActive: true,
      }
    });

    return {
      success: true,
      data: staff,
      message: "Staff member created successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to create staff member"
    };
  }
};

// Create staff invitation (for system users)
export const createInvite = async (data: CreateInviteData): Promise<ApiResponse> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    // Check if user has permission to create invites
    const currentUser = session.user as any;
    if (currentUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Insufficient permissions to create invites"
      };
    }

    // For system users, email is required
    if (!data.email) {
      return {
        success: false,
        message: "Email is required for system users"
      };
    }

    // Check if email already exists in staff table
    const existingStaff = await prisma.staff.findFirst({
      where: { email: data.email }
    });

    if (existingStaff) {
      return {
        success: false,
        message: "A staff member with this email already exists"
      };
    }

    // Check if there's already a pending invite
    const existingInvite = await prisma.invite.findFirst({
      where: { 
        email: data.email,
        isUsed: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (existingInvite) {
      return {
        success: false,
        message: "A pending invitation already exists for this email"
      };
    }

    // Generate unique token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation
    const invite = await prisma.invite.create({
      data: {
        email: data.email,
        role: data.role,
        token,
        expiresAt,
        createdById: data.createdById,
      }
    });

    // Send invitation email using centralized service
    const emailResult = await sendInviteEmail(data.email, token, data.role);
    if (!emailResult.success) {
      // If email sending fails, delete the invite
      await prisma.invite.delete({
        where: { id: invite.id }
      });
      return emailResult;
    }

    return {
      success: true,
      data: invite,
      message: "Invitation sent successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to create invitation"
    };
  }
};

// Verify invitation token
export const verifyInviteToken = async (token: string): Promise<ApiResponse> => {
  try {
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    if (!invite) {
      return {
        success: false,
        message: "Invalid invitation token"
      };
    }

    if (invite.isUsed) {
      return {
        success: false,
        message: "This invitation has already been used"
      };
    }

    if (invite.expiresAt < new Date()) {
      return {
        success: false,
        message: "This invitation has expired"
      };
    }

    return {
      success: true,
      data: {
        email: invite.email,
        role: invite.role,
        createdBy: invite.createdBy?.name,
        createdAt: invite.createdAt
      }
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to verify invitation"
    };
  }
};

// Accept invitation and create staff account
export const acceptInvite = async (data: InviteVerificationData): Promise<ApiResponse> => {
  try {
    // Verify token first
    const tokenVerification = await verifyInviteToken(data.token);
    if (!tokenVerification.success) {
      return tokenVerification;
    }

    const invite = await prisma.invite.findUnique({
      where: { token: data.token }
    });

    if (!invite) {
      return {
        success: false,
        message: "Invalid invitation token"
      };
    }

    // Check if email already exists
    const existingStaff = await prisma.staff.findFirst({
      where: { email: invite.email }
    });

    if (existingStaff) {
      return {
        success: false,
        message: "A staff member with this email already exists"
      };
    }

    // Create staff account using better-auth
    const authResult = await auth.api.signUpEmail({
      body: {
        email: invite.email,
        password: data.password,
        name: `${data.firstName} ${data.lastName}`,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        role: invite.role
      }
    });

    if (!authResult) {
      return {
        success: false,
        message: "Failed to create staff account"
      };
    }

    // Mark invitation as used
    await prisma.invite.update({
      where: { id: invite.id },
      data: { isUsed: true }
    });

    // Create leave balance for the new staff
    const currentYear = new Date().getFullYear();
    const totalLeaveDays = invite.role === 'ADMIN' ? 25 : 
                          invite.role === 'VETERINARIAN' ? 20 : 15;

    // Note: This would require a leaveBalance table in the schema
    // await prisma.leaveBalance.create({
    //   data: {
    //     staffId: authResult.user.id,
    //     year: currentYear,
    //     totalLeaveDays,
    //     usedLeaveDays: 0,
    //     remainingLeaveDays: totalLeaveDays
    //   }
    // });

    return {
      success: true,
      data: authResult.user,
      message: "Account created successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to accept invitation"
    };
  }
};

// Get invitations (for admin)
export const getInvites = async (createdById?: string): Promise<ApiResponse> => {
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

    const invites = await prisma.invite.findMany({
      where: createdById ? { createdById } : {},
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      success: true,
      data: invites
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to fetch invitations"
    };
  }
};

// Cancel invitation
export const cancelInvite = async (inviteId: string): Promise<ApiResponse> => {
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

    const invite = await prisma.invite.findUnique({
      where: { id: inviteId }
    });

    if (!invite) {
      return {
        success: false,
        message: "Invitation not found"
      };
    }

    if (invite.isUsed) {
      return {
        success: false,
        message: "Cannot cancel a used invitation"
      };
    }

    await prisma.invite.delete({
      where: { id: inviteId }
    });

    return {
      success: true,
      message: "Invitation cancelled successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to cancel invitation"
    };
  }
};

// Resend invitation
export const resendInvite = async (inviteId: string): Promise<ApiResponse> => {
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

    const invite = await prisma.invite.findUnique({
      where: { id: inviteId }
    });

    if (!invite) {
      return {
        success: false,
        message: "Invitation not found"
      };
    }

    if (invite.isUsed) {
      return {
        success: false,
        message: "Cannot resend a used invitation"
      };
    }

    // Generate new token and extend expiry
    const newToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const updatedInvite = await prisma.invite.update({
      where: { id: inviteId },
      data: {
        token: newToken,
        expiresAt
      }
    });

    // Send new invitation email
    await sendInviteEmail(invite.email, newToken, invite.role);

    return {
      success: true,
      data: updatedInvite,
      message: "Invitation resent successfully"
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to resend invitation"
    };
  }
};

// Get all staff members
export const getAllStaff = async (): Promise<ApiResponse> => {
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
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      success: true,
      data: staff
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "Failed to fetch staff members"
    };
  }
};

