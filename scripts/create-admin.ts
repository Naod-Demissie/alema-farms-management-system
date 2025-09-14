import { config } from "dotenv";
import { prisma } from "../lib/prisma";
import { auth } from "../lib/auth";

// Load environment variables from .env file
config();

async function createAdmin() {
  try {
    const config = {
      firstName: process.env.DEFAULT_ADMIN_FIRST_NAME,
      lastName: process.env.DEFAULT_ADMIN_LAST_NAME,
      email: process.env.DEFAULT_ADMIN_EMAIL,
      password: process.env.DEFAULT_ADMIN_PASSWORD,
      phoneNumber: process.env.DEFAULT_ADMIN_PHONE,
      role: "ADMIN" as const,
    };

    console.log("Config:", config);

    if (!config.email) throw new Error("DEFAULT_ADMIN_EMAIL is required");
    if (!config.password) throw new Error("DEFAULT_ADMIN_PASSWORD is required");
    if (config.password.length < 8)
      throw new Error("DEFAULT_ADMIN_PASSWORD must be at least 8 characters");

    // Check if user already exists
    const existing = await prisma.staff.findUnique({
      where: { email: config.email },
    });
    if (existing) {
      console.log(`⚠️  Email ${config.email} already exists`);
      return;
    }

    // Sign up user
    const result = await auth.api.signUpEmail({
      body: {
        name: `${config.firstName || ''} ${config.lastName || ''}`,
        email: config.email!,
        password: config.password!,
        firstName: config.firstName || '',
        lastName: config.lastName || '',
        phoneNumber: config.phoneNumber || '',
      },
    });

    console.log("Sign up result:", result);

    // Update role to ADMIN
    if (result && result.user) {
      const user = await prisma.staff.update({
        where: { id: result.user.id },
        data: {
          role: config.role,
        },
      });
      console.log("User updated with role:", user);

      console.log(`✅ Admin user ${config.email} created successfully.`);
      console.log(`📧 Email: ${config.email}`);
      console.log(`🔑 Password: ${config.password}`);
      console.log(`⚠️  Please change the default password after first login!`);
    } else {
      throw new Error("Sign up failed, no user returned");
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error("❌ Failed to create admin:", err.message);
    } else {
      console.error("❌ Failed to create admin:", err);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
