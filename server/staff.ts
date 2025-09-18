"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma"; 
import { headers } from "next/headers";
import { withAuth, withAdminAuth, withResourceAccess, AuthenticatedUser } from "./auth-middleware";
import { sendMagicLinkEmail } from "./email"; 

// ===================
// Authentication Actions
// ===================

export const signIn = async (email: string, password: string) => {
    try {
        await auth.api.signInEmail({
            body: {
                email,
                password,
            }
        });

        return {
            success: true,
            message: "Signed in successfully."
        };
    } catch (error) {
        const e = error as Error;
        console.log(e)

        return {
            success: false,
            message: e.message || "An unknown error occurred."
        };
    }
};




export const signOut = async () => {
    try {
        await auth.api.signOut({ headers: {} });
        
        return {
            success: true,
            message: "Signed out successfully."
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
        const session = await auth.api.getSession({ headers: await headers() });
        
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

export const getStaff = async () => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return {
                success: false,
                message: "Authentication required"
            };
        }

        const staff = await prisma.staff.findMany({
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                name: true,
                email: true,
                emailVerified: true,
                image: true,
                phoneNumber: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return {
            success: true,
            data: staff
        };
    } catch (error) {
        const e = error as Error;
        return {
            success: false,
            message: e.message || "Failed to fetch staff"
        };
    }
};

export const getStaffById = async (id: string) => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return {
                success: false,
                message: "Authentication required"
            };
        }

        const staff = await prisma.staff.findUnique({
            where: { id },
            include: {
                sessions: {
                    select: {
                        id: true,
                        createdAt: true,
                        expiresAt: true,
                        ipAddress: true,
                        userAgent: true,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 3, // Last 3 sessions
                },
                treatments: {
                    select: {
                        id: true,
                        disease: true,
                        medication: true,
                        response: true,
                        createdAt: true,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 5, // Last 5 treatments
                },
            },
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

export const updateStaff = async (
    id: string,
    data: {
        firstName: string;
        lastName: string;
        phoneNumber?: string;
        role?: string;
        isActive?: boolean;
        image?: string;
    }
) => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });


        if (!session?.user) {
            return {
                success: false,
                message: "Authentication required"
            };
        }

        const currentUser = session.user as any;

        // Check permissions - admin can update anyone, staff can update themselves
        if (currentUser.role !== "ADMIN" && currentUser.id !== id) {
            return {
                success: false,
                message: "Insufficient permissions"
            };
        }

        // Validate required fields
        if (!data.firstName || !data.lastName) {
            return {
                success: false,
                message: "First name and last name are required"
            };
        }

        // Prepare update data
        let updateData: any = {
            firstName: data.firstName,
            lastName: data.lastName,
            name: `${data.firstName} ${data.lastName}`,
            phoneNumber: data.phoneNumber,
        };

        // Include image if provided
        if (data.image !== undefined) {
            updateData.image = data.image;
        }

        // Only admins can change role and active status
        if (currentUser.role === "ADMIN") {
            if (data.role && ["ADMIN", "VETERINARIAN", "WORKER"].includes(data.role)) {
                updateData.role = data.role;
            }
            if (typeof data.isActive === "boolean") {
                updateData.isActive = data.isActive;
            }
        }

        const updatedStaff = await prisma.staff.update({
            where: { id },
            data: updateData,
        });

        return {
            success: true,
            data: updatedStaff,
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

// Note: Staff invitation logic has been moved to staff-invites.ts
// This function is kept for backward compatibility but delegates to the centralized service
export const inviteStaff = async (email: string, role: string) => {
    // Import the centralized invitation function
    const { createInvite } = await import('./staff-invites');
    
    // Get current user for createdById
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return {
            success: false,
            message: "Authentication required"
        };
    }

    return createInvite({
        email,
        role: role as any,
        createdById: (session.user as any).id
    });
};

export const getPendingInvites = async () => {
    try {
        const session = await auth.api.getSession({
            headers: new Headers()
        });

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
                message: "Admin access required"
            };
        }

        const pendingInvites = await prisma.invite.findMany({
            where: {
                isUsed: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                email: true,
                role: true,
                expiresAt: true,
                createdAt: true,
            },
        });

        return {
            success: true,
            data: pendingInvites
        };
    } catch (error) {
        const e = error as Error;
        return {
            success: false,
            message: e.message || "Failed to fetch pending invites"
        };
    }
};

// ===================
// Invite Completion Actions
// ===================

export const validateInvite = async (token: string, email: string) => {
    try {
        const invite = await prisma.invite.findUnique({
            where: { email }
        });

        if (!invite) {
            return {
                success: false,
                message: "Invitation not found"
            };
        }

        if (invite.token !== token) {
            return {
                success: false,
                message: "Invalid invitation token"
            };
        }

        if (invite.isUsed) {
            return {
                success: false,
                message: "Invitation has already been used"
            };
        }

        if (invite.expiresAt < new Date()) {
            return {
                success: false,
                message: "Invitation has expired"
            };
        }

        return {
            success: true,
            data: {
                email: invite.email,
                role: invite.role,
                expiresAt: invite.expiresAt,
            }
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
    staffData: {
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

        const invite = await prisma.invite.findUnique({
            where: { email }
        });

        if (!invite) {
            return {
                success: false,
                message: "Invitation not found"
            };
        }

        const name = `${staffData.firstName} ${staffData.lastName}`;

        // Create the staff account using Better Auth
        try {
              const result = await auth.api.signUpEmail({
                body: {
                  name: name,
                  email: email,
                  password: staffData.password,
                  firstName: staffData.firstName,
                  lastName: staffData.lastName,
                  phoneNumber: staffData.phoneNumber,
                  role: invite.role,
                  isActive: true,

                },
              });
            //   change the role to ADMIN
              if (result && result.user) {
                const user = await prisma.staff.update({
                  where: { id: result.user.id },
                  data: {
                    image: staffData.image,
                    },
                });
                console.log("User updated with role:", user);
              }
            
              if (!result) {
                // log error
                console.error("Error during sign up:", result);
              }
              console.log("Sign up result:", result);




            // Mark invite as used
            await prisma.invite.update({
                where: { id: invite.id },
                data: { isUsed: true }
            });

            // Sign in the user automatically
            const signInResult = await signIn(email, staffData.password);
            
            return {
                success: true,
                message: "Registration completed successfully",
                data: {
                    email,
                    role: invite.role,
                    signedIn: signInResult.success
                }
            };


        } catch (authError) {
            console.error("Failed to create staff account:", authError);
            return {
                success: false,
                message: "Failed to create staff account"
            };
        }

    } catch (error) {
        const e = error as Error;
        return {
            success: false,
            message: e.message || "Failed to complete registration"
        };
    }
};

// Delete staff member
export const deleteStaff = async (id: string): Promise<ApiResponse> => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return {
                success: false,
                message: "Authentication required"
            };
        }

        const currentUser = session.user as any;

        // Check permissions - only admin can delete staff
        if (currentUser.role !== "ADMIN") {
            return {
                success: false,
                message: "Insufficient permissions to delete staff"
            };
        }

        // Check if staff member exists
        const staff = await prisma.staff.findUnique({
            where: { id }
        });

        if (!staff) {
            return {
                success: false,
                message: "Staff member not found"
            };
        }

        // Prevent deleting self
        if (currentUser.id === id) {
            return {
                success: false,
                message: "Cannot delete your own account"
            };
        }

        // Delete staff member
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
