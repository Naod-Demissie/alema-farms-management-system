"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function getLightingRecords(flockId?: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const whereClause: any = {};
    if (flockId) {
      whereClause.flockId = flockId;
    }

    const records = await prisma.lightingSchedule.findMany({
      where: whereClause,
      include: {
        flock: {
          select: {
            batchCode: true,
            currentCount: true,
          },
        },
        recordedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return { success: true, data: records };
  } catch (error) {
    console.error("Error fetching lighting records:", error);
    return { success: false, error: "Failed to fetch lighting records" };
  }
}

export async function createLightingRecord(data: {
  flockId: string;
  date: Date;
  lightOnTime: string;
  lightOffTime: string;
  totalHours: number;
  interruptedHours?: number;
  notes?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const record = await prisma.lightingSchedule.create({
      data: {
        flockId: data.flockId,
        date: data.date,
        lightOnTime: data.lightOnTime,
        lightOffTime: data.lightOffTime,
        totalHours: data.totalHours,
        interruptedHours: data.interruptedHours || 0,
        notes: data.notes,
        recordedById: session.user.id,
      },
    });

    revalidatePath("/environment");
    return { success: true, data: record };
  } catch (error) {
    console.error("Error creating lighting record:", error);
    return { success: false, error: "Failed to create lighting record" };
  }
}

export async function updateLightingRecord(
  id: string,
  data: {
    flockId?: string;
    date?: Date;
    lightOnTime?: string;
    lightOffTime?: string;
    totalHours?: number;
    interruptedHours?: number;
    notes?: string;
  }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const record = await prisma.lightingSchedule.update({
      where: { id },
      data,
    });

    revalidatePath("/environment");
    return { success: true, data: record };
  } catch (error) {
    console.error("Error updating lighting record:", error);
    return { success: false, error: "Failed to update lighting record" };
  }
}

export async function deleteLightingRecord(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.lightingSchedule.delete({
      where: { id },
    });

    revalidatePath("/environment");
    return { success: true };
  } catch (error) {
    console.error("Error deleting lighting record:", error);
    return { success: false, error: "Failed to delete lighting record" };
  }
}

export async function getLightingStats() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's average
    const todayAvg = await prisma.lightingSchedule.aggregate({
      where: {
        date: {
          gte: today,
        },
      },
      _avg: {
        totalHours: true,
        interruptedHours: true,
      },
    });

    // Week's average
    const weekAvg = await prisma.lightingSchedule.aggregate({
      where: {
        date: {
          gte: weekStart,
        },
      },
      _avg: {
        totalHours: true,
        interruptedHours: true,
      },
    });

    // Month's average
    const monthAvg = await prisma.lightingSchedule.aggregate({
      where: {
        date: {
          gte: monthStart,
        },
      },
      _avg: {
        totalHours: true,
        interruptedHours: true,
      },
    });

    // Total records
    const totalRecords = await prisma.lightingSchedule.count();

    return {
      success: true,
      data: {
        today: {
          totalHours: todayAvg._avg.totalHours || 0,
          interruptedHours: todayAvg._avg.interruptedHours || 0,
        },
        week: {
          totalHours: weekAvg._avg.totalHours || 0,
          interruptedHours: weekAvg._avg.interruptedHours || 0,
        },
        month: {
          totalHours: monthAvg._avg.totalHours || 0,
          interruptedHours: monthAvg._avg.interruptedHours || 0,
        },
        totalRecords,
      },
    };
  } catch (error) {
    console.error("Error fetching lighting stats:", error);
    return { success: false, error: "Failed to fetch lighting stats" };
  }
}

