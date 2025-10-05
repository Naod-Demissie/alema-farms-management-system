import transporter from "@/lib/nodemailer"; 
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { sessionCache } from './session-cache';

// Dynamic base URL based on environment
const getBaseURL = () => {
  // Always use NEXT_PUBLIC_APP_URL if available, regardless of environment
  if (process.env.NEXT_PUBLIC_APP_URL) {
    console.log('[Auth Server] Using NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Fallback for production
  if (process.env.NODE_ENV === 'production') {
    console.log('[Auth Server] Using production fallback URL');
    return "https://alemafarms.vercel.app";
  }
  
  // For development, allow both localhost and network IP
  const host = process.env.HOST || 'localhost';
  const port = process.env.PORT || '3000';
  
  if (host === '0.0.0.0' || host === '::') {
    // When binding to all interfaces, use localhost for auth
    return `http://localhost:${port}`;
  }
  
  return `http://${host}:${port}`;
};

const baseURL = getBaseURL();
console.log('[Auth Server] Base URL:', baseURL);

export const auth = betterAuth({
    // Configure base URL for proper session handling
    baseURL,
    
    // Configure cookie prefix for consistent naming
    cookiePrefix: "better-auth",
    
    // Add CORS configuration for network access
    cors: {
        origin: [
            "http://localhost:3000",
            "http://192.168.1.8:3000",
            "http://127.0.0.1:3000",
            "https://alemafarms.vercel.app"
        ],
        credentials: true,
    },
    
    // Configure cookies for network access
    cookies: {
        sessionToken: {
            name: "better-auth.session_token",
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Secure in production
            sameSite: "lax", // More permissive for mobile browsers
            maxAge: 60 * 60 * 24 * 7, // 7 days
            domain: undefined, // Remove domain restriction to fix production issues
        },
    },
    
    // Configure user model to use Staff
    user: {
        modelName: "staff", 
        fields: {
            name: "name",
            email: "email",
            emailVerified: "emailVerified",
            image: "image",
            createdAt: "createdAt", 
            updatedAt: "updatedAt",
        },
        additionalFields: {
            firstName: {
                type: "string",
                required: true,
                input: true,
            },
            lastName: {
                type: "string", 
                required: true,
                input: true,
            },
            phoneNumber: {
                type: "string",
                required: false,
                input: true,
            },
            role: {
                type: ["ADMIN", "VETERINARIAN", "WORKER"], 
                required: true,
                input: true,
                defaultValue: 'WORKER', 

            },
            isActive: {
                type: "boolean",
                required: true,
                defaultValue: true,
                input: true,
            },
        },
    },
    
    // Configure session model
    session: {
        modelName: "sessions",
        expiresIn: 60 * 60 * 24 * 7, // 1 week in seconds
        fields: {
            userId: "userId", // References Staff.id
            expiresAt: "expiresAt",
            token: "token",
            createdAt: "createdAt",
            updatedAt: "updatedAt",
            ipAddress: "ipAddress",
            userAgent: "userAgent",
        },
    },

    // Configure account model
    account: {
        modelName: "accounts",
        fields: {
            userId: "userId", // References Staff.id
            accountId: "accountId",
            providerId: "providerId",
            accessToken: "accessToken",
            refreshToken: "refreshToken",
            idToken: "idToken",
            accessTokenExpiresAt: "accessTokenExpiresAt",
            refreshTokenExpiresAt: "refreshTokenExpiresAt",
            scope: "scope",
            password: "password",
            createdAt: "createdAt",
            updatedAt: "updatedAt",
        },
    },

    // Configure verification model
    verification: {
        modelName: "verifications",
        fields: {
            identifier: "identifier",
            value: "value",
            expiresAt: "expiresAt",
            createdAt: "createdAt",
            updatedAt: "updatedAt",
        },
    },

    // Social providers
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
// Email and password authentication
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }) => {
            const mailOptions = {
                from: process.env.NODEMAILER_USER,
                to: user.email,
                subject: "Reset Password Link",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Password Reset - ${process.env.NEXT_PUBLIC_FARM_NAME || 'Poultry Farm Management'}</h2>
                        <p>Hello ${user.email || 'User'},</p>
                        <p>You have requested to reset your password. Please click the link below to set a new password:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
                        </div>
                        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.</p>
                        <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
                        <p style="color: #007bff; word-break: break-all;">${url}</p>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 12px;">This email was sent from ${process.env.NEXT_PUBLIC_FARM_NAME || 'Poultry Farm Management'} system.</p>
                    </div>
                `,
            };

            try {
                await transporter.sendMail(mailOptions);
                console.log(`Reset password email sent to ${user.email}`);
            } catch (error) {
                console.error("Failed to send reset password email:", error);
                throw new Error("Failed to send reset password email");
            }
        },
        requireEmailVerification: false,
        resetPasswordTokenExpiresIn: 3600, // 1 hour in seconds
    },

    // Database adapter
    database: prismaAdapter(prisma, {
        // provider: "mysql",
        provider: "postgresql",
    }),

    // Plugins
    plugins: [
        nextCookies(),
    ],

});

// Server-side session function for use in server actions
export async function getServerSession() {
  try {
    // Use the working auth.api.getSession as base
    const { headers } = await import("next/headers");
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return null;
    }
    
    // Check cache first
    const cachedSession = sessionCache.get(session.session.token);
    if (cachedSession) {
      return {
        user: cachedSession.user,
        session: cachedSession.session,
      };
    }

    // Cache the session data
    const sessionData = {
      user: session.user,
      session: {
        id: session.session.id,
        userId: session.session.userId,
        expiresAt: session.session.expiresAt,
        token: session.session.token,
      },
    };

    // Cache the session
    sessionCache.set(session.session.token, sessionData);

    return sessionData;
  } catch (error) {
    console.error("Error getting server session:", error);
    return null;
  }
}

