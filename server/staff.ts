"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { getAuthenticatedUser } from "./auth-middleware";
import { ApiResponse } from "./types";
import { getServerSession } from "@/lib/auth";
import { sessionCache } from "@/lib/session-cache";

// ===================
// Authentication Actions
// ===================

export const signIn = async (email: string, password: string) => {
    try {
        const result = await auth.api.signInEmail({
            body: {
                email,
                password,
            },
            headers: await headers()
        });

        return {
            success: true,
            message: "Signed in successfully."
        };
    } catch (error) {
        const e = error as Error;

        return {
            success: false,
            message: e.message || "An unknown error occurred."
        };
    }
};




export const signOut = async () => {
    try {
        const session = await getServerSession();
        
        if (session) {
            // Clear from cache
            sessionCache.delete(session.session.token);
        }

        await auth.api.signOut({ headers: await headers() });
        
        return {
            success: true,
            message: "Successfully signed out."
        };
    } catch (error) {
        const e = error as Error;

        return {
            success: false,
            message: e.message || "Failed to sign out."
        };
    }
};




export const getCurrentSession = async () => {
    try {
        const session = await getServerSession();
        
        if (!session) {
            return {
                success: false,
                message: "No active session found."
            };
        }

        return {
            success: true,
            data: session
        };
    } catch (error) {
        const e = error as Error;

        return {
            success: false,
            message: e.message || "Failed to get session."
        };
    }
};

// ===================
// Staff Management Actions
// ===================

export const getStaff = async (filters: any = {}, pagination: any = {}, sort: any = { field: 'createdAt', direction: 'desc' }) => {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

        const user = authResult.user!;

        // Check if user has permission to view staff
        if (user.role !== "ADMIN" && user.role !== "VETERINARIAN") {
            return {
                success: false,
                message: "Insufficient permissions to view staff"
            };
        }

        const { page = 1, limit = 10 } = pagination;
        const { field = 'createdAt', direction = 'desc' } = sort;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (filters.role) {
            where.role = filters.role;
        }

        if (filters.isActive !== undefined) {
            where.isActive = filters.isActive;
        }

        if (filters.search) {
            where.OR = [
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } }
            ];
        }

        const [staff, total] = await Promise.all([
            prisma.staff.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [field]: direction },
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
                updatedAt: true,
                }
            }),
            prisma.staff.count({ where })
        ]);

        return {
            success: true,
            data: staff,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        const e = error as Error;
        return {
            success: false,
            message: e.message || "Failed to fetch staff"
        };
    }
};

export const createStaff = async (data: any) => {
    try {
        const authResult = await getAuthenticatedUser();
        if (!authResult.success) {
            return {
                success: false,
                message: authResult.message || "Authentication required"
            };
        }

        const user = authResult.user!;

        // Check if user has permission to create staff
        if (user.role !== "ADMIN") {
            return {
                success: false,
                message: "Only administrators can create staff"
            };
        }

        // Check if email already exists
        const existingStaff = await prisma.staff.findUnique({
            where: { email: data.email }
        });

        if (existingStaff) {
            return {
                success: false,
                message: "A staff member with this email already exists"
            };
        }

        const staff = await prisma.staff.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                name: `${data.firstName} ${data.lastName}`,
                email: data.email,
                phoneNumber: data.phoneNumber,
                role: data.role || 'WORKER',
                isActive: data.isActive !== undefined ? data.isActive : true,
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

export const updateStaff = async (id: string, data: any) => {
    try {
        const authResult = await getAuthenticatedUser();
        if (!authResult.success) {
            return {
                success: false,
                message: authResult.message || "Authentication required"
            };
        }

        const user = authResult.user!;

        // Check if user has permission to update staff
        if (user.role !== "ADMIN" && user.id !== id) {
            return {
                success: false,
                message: "Insufficient permissions to update this staff member"
            };
        }

        // Check if staff exists
        const existingStaff = await prisma.staff.findUnique({
            where: { id }
        });

        if (!existingStaff) {
            return {
                success: false,
                message: "Staff member not found"
            };
        }

        // Check if email is being changed and if it already exists
        if (data.email && data.email !== existingStaff.email) {
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
            updateData.name = `${data.firstName || existingStaff.firstName} ${data.lastName || existingStaff.lastName}`;
        }
        if (data.email) updateData.email = data.email;
        if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
        if (data.image !== undefined) updateData.image = data.image;
        if (data.role && user.role === "ADMIN") updateData.role = data.role;
        if (data.isActive !== undefined && user.role === "ADMIN") updateData.isActive = data.isActive;

        const staff = await prisma.staff.update({
            where: { id },
            data: updateData
        });

        return {
            success: true,
            data: staff,
            message: "Staff member updated successfully"
        };
    } catch (error) {
        const e = error as Error;
        return {
            success: false,
            message: e.message || "Failed to update staff member"
        };
    }
};

export const deleteStaff = async (id: string) => {
    try {
        const authResult = await getAuthenticatedUser();
        if (!authResult.success) {
            return {
                success: false,
                message: authResult.message || "Authentication required"
            };
        }

        const user = authResult.user!;

        // Check if user has permission to delete staff
        if (user.role !== "ADMIN") {
            return {
                success: false,
                message: "Only administrators can delete staff"
            };
        }

        // Check if staff exists
        const existingStaff = await prisma.staff.findUnique({
            where: { id }
        });

        if (!existingStaff) {
            return {
                success: false,
                message: "Staff member not found"
            };
        }

        // Prevent self-deletion
        if (user.id === id) {
            return {
                success: false,
                message: "You cannot delete your own account"
            };
        }

        await prisma.staff.delete({
            where: { id }
        });

        return {
            success: true,
            message: "Staff member deleted successfully"
        };
    } catch (error) {
        const e = error as Error;
        return {
            success: false,
            message: e.message || "Failed to delete staff member"
        };
    }
};

export const getStaffById = async (id: string) => {
    try {
        const authResult = await getAuthenticatedUser();
        if (!authResult.success) {
            return {
                success: false,
                message: authResult.message || "Authentication required"
            };
        }

        const user = authResult.user!;
        
        // Check if user has permission to view this staff member
        if (user.role !== "ADMIN" && user.role !== "VETERINARIAN" && user.id !== id) {
            return {
                success: false,
                message: "Insufficient permissions to view this staff member"
            };
        }

        const staff = await prisma.staff.findUnique({
            where: { id },
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
                updatedAt: true,
            }
        });

        if (!staff) {
            return {
                success: false,
                message: "Staff member not found"
            };
        }

        return {
            success: true,
            data: staff
        };
    } catch (error) {
        const e = error as Error;
        return {
            success: false,
            message: e.message || "Failed to fetch staff member"
        };
    }
};

// ===================
// Staff Invite Management
// ===================

export const getPendingInvites = async () => {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return {
                success: false,
                message: "Authentication required"
            };
        }

        const user = session.user;

        // Check if user has permission to view invites
        if (user.role !== "ADMIN") {
            return {
                success: false,
                message: "Only administrators can view pending invites"
            };
        }

        const invites = await prisma.invite.findMany({
            where: {
                isUsed: false,
                expiresAt: {
                    gt: new Date()
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                expiresAt: true,
                createdBy: {
                    select: {
                        firstName: true,
                        lastName: true,
                        name: true
                    }
                }
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
            message: e.message || "Failed to fetch pending invites"
        };
    }
};

export const createInvite = async (data: { email: string; role: string }) => {
    try {
        const authResult = await getAuthenticatedUser();
        if (!authResult.success) {
            return {
                success: false,
                message: authResult.message || "Authentication required"
            };
        }

        const user = authResult.user!;

        // Check if user has permission to create invites
        if (user.role !== "ADMIN") {
            return {
                success: false,
                message: "Only administrators can create invites"
            };
        }

        // Check if email already exists in staff
        const existingStaff = await prisma.staff.findUnique({
            where: { email: data.email }
        });

        if (existingStaff) {
            return {
                success: false,
                message: "A staff member with this email already exists"
            };
        }

        // Check if there's already a pending invite for this email
        const existingInvite = await prisma.invite.findFirst({
            where: {
                email: data.email,
                isUsed: false,
                expiresAt: {
                    gt: new Date()
                }
            }
        });

        if (existingInvite) {
            return {
                success: false,
                message: "A pending invite already exists for this email"
            };
        }

        // Create invite
        const invite = await prisma.invite.create({
            data: {
                email: data.email,
                role: data.role as any, // Cast to StaffRole
                createdById: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
            }
        });

        return {
            success: true,
            data: invite,
            message: "Invite created successfully"
        };
    } catch (error) {
        const e = error as Error;
        return {
            success: false,
            message: e.message || "Failed to create invite"
        };
    }
};

export const cancelInvite = async (inviteId: string) => {
    try {
        const authResult = await getAuthenticatedUser();
        if (!authResult.success) {
            return {
                success: false,
                message: authResult.message || "Authentication required"
            };
        }

        const user = authResult.user!;

        // Check if user has permission to cancel invites
        if (user.role !== "ADMIN") {
            return {
                success: false,
                message: "Only administrators can cancel invites"
            };
        }

        // Check if invite exists
        const existingInvite = await prisma.invite.findUnique({
            where: { id: inviteId }
        });

        if (!existingInvite) {
            return {
                success: false,
                message: "Invite not found"
            };
        }

        if (existingInvite.isUsed) {
            return {
                success: false,
                message: "Only unused invites can be cancelled"
            };
        }

        // Cancel invite by marking as used
        await prisma.invite.update({
            where: { id: inviteId },
            data: { isUsed: true }
        });

        return {
            success: true,
            message: "Invite cancelled successfully"
        };
    } catch (error) {
        const e = error as Error;
        return {
            success: false,
            message: e.message || "Failed to cancel invite"
        };
    }
};

export const validateInvite = async (token: string, email: string) => {
    try {
        // Find the invite by token and email
        const invite = await prisma.invite.findFirst({
            where: {
                token,
                email,
                isUsed: false,
                expiresAt: {
                    gt: new Date()
                }
            },
            select: {
                id: true,
                email: true,
                role: true,
                expiresAt: true,
                createdAt: true
            }
        });

        if (!invite) {
            return {
                success: false,
                message: "Invalid or expired invitation"
            };
        }

        return {
            success: true,
            data: invite
        };
    } catch (error) {
        const e = error as Error;
        return {
            success: false,
            message: e.message || "Failed to validate invitation"
        };
    }
};

export const completeStaffRegistration = async (
    token: string, 
    email: string, 
    registrationData: {
        firstName: string;
        lastName: string;
        password: string;
        phoneNumber?: string;
        image?: string;
    }
) => {
    try {
        // First validate the invite
        const inviteValidation = await validateInvite(token, email);
        if (!inviteValidation.success) {
            return inviteValidation;
        }

        const invite = inviteValidation.data!;

        // Check if staff member already exists
        const existingStaff = await prisma.staff.findUnique({
            where: { email }
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
                email: email,
                password: registrationData.password,
                name: `${registrationData.firstName} ${registrationData.lastName}`,
                firstName: registrationData.firstName,
                lastName: registrationData.lastName,
                phoneNumber: registrationData.phoneNumber,
                role: invite.role,
                image: registrationData.image || null
            },
            headers: await headers()
        });

        if (!authResult) {
            return {
                success: false,
                message: "Failed to create staff account"
            };
        }

        // Mark the invite as used
        await prisma.invite.update({
            where: { id: invite.id },
            data: { isUsed: true }
        });

        return {
            success: true,
            data: authResult.user,
            message: "Registration completed successfully"
        };
    } catch (error) {
        const e = error as Error;
        return {
            success: false,
            message: e.message || "Failed to complete registration"
        };
    }
};

// ===================
// Staff Statistics
// ===================

export const getStaffStatistics = async () => {
    try {
        const authResult = await getAuthenticatedUser();
        if (!authResult.success) {
            return {
                success: false,
                message: authResult.message || "Authentication required"
            };
        }

        const user = authResult.user!;

        // Check if user has permission to view statistics
        if (user.role !== "ADMIN" && user.role !== "VETERINARIAN") {
            return {
                success: false,
                message: "Insufficient permissions to view statistics"
            };
        }

        const [totalStaff, activeStaff, inactiveStaff, roleStats] = await Promise.all([
            prisma.staff.count(),
            prisma.staff.count({ where: { isActive: true } }),
            prisma.staff.count({ where: { isActive: false } }),
            prisma.staff.groupBy({
                by: ['role'],
                _count: {
                    role: true
                }
            })
        ]);

        const roleBreakdown = roleStats.map(stat => ({
            role: stat.role,
            count: stat._count.role
        }));

        return {
            success: true,
            data: {
                totalStaff,
                activeStaff,
                inactiveStaff,
                roleBreakdown
            }
        };
    } catch (error) {
        const e = error as Error;
        return {
            success: false,
            message: e.message || "Failed to fetch staff statistics"
        };
    }
};