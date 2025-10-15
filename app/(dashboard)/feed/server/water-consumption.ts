"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface WaterConsumptionData {
  flockId: string;
  date: Date;
  consumption: number;
  notes?: string;
}

export async function getWaterConsumption(page: number = 1, limit: number = 100) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.waterConsumption.findMany({
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          flock: {
            select: {
              id: true,
              batchCode: true,
              currentCount: true,
            },
          },
          recordedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.waterConsumption.count(),
    ]);

    return {
      success: true,
      data: {
        records,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching water consumption:", error);
    return { success: false, error: "Failed to fetch water consumption records" };
  }
}

export async function createWaterConsumption(data: WaterConsumptionData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const record = await prisma.waterConsumption.create({
      data: {
        flockId: data.flockId,
        date: data.date,
        consumption: data.consumption,
        notes: data.notes,
        recordedById: session.user.id,
      },
      include: {
        flock: {
          select: {
            id: true,
            batchCode: true,
            currentCount: true,
          },
        },
        recordedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return { success: true, data: record };
  } catch (error) {
    console.error("Error creating water consumption record:", error);
    return { success: false, error: "Failed to create water consumption record" };
  }
}

export async function updateWaterConsumption(id: string, data: WaterConsumptionData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const record = await prisma.waterConsumption.update({
      where: { id },
      data: {
        flockId: data.flockId,
        date: data.date,
        consumption: data.consumption,
        notes: data.notes,
      },
      include: {
        flock: {
          select: {
            id: true,
            batchCode: true,
            currentCount: true,
          },
        },
        recordedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return { success: true, data: record };
  } catch (error) {
    console.error("Error updating water consumption record:", error);
    return { success: false, error: "Failed to update water consumption record" };
  }
}

export async function deleteWaterConsumption(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.waterConsumption.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting water consumption record:", error);
    return { success: false, error: "Failed to delete water consumption record" };
  }
}

export async function getWaterConsumptionStats() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayTotal, weekTotal, monthTotal, totalRecords, totalConsumption] = await Promise.all([
      prisma.waterConsumption.aggregate({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
        _sum: {
          consumption: true,
        },
      }),
      prisma.waterConsumption.aggregate({
        where: {
          date: {
            gte: weekStart,
          },
        },
        _sum: {
          consumption: true,
        },
      }),
      prisma.waterConsumption.aggregate({
        where: {
          date: {
            gte: monthStart,
          },
        },
        _sum: {
          consumption: true,
        },
      }),
      prisma.waterConsumption.count(),
      prisma.waterConsumption.aggregate({
        _sum: {
          consumption: true,
        },
      }),
    ]);

    // Get active flocks count
    const activeFlocks = await prisma.flocks.count({
      where: {
        currentCount: {
          gt: 0,
        },
      },
    });

    return {
      success: true,
      data: {
        todayConsumption: todayTotal._sum.consumption || 0,
        weekConsumption: weekTotal._sum.consumption || 0,
        monthConsumption: monthTotal._sum.consumption || 0,
        totalConsumption: totalConsumption._sum.consumption || 0,
        totalRecords,
        activeFlocks,
      },
    };
  } catch (error) {
    console.error("Error fetching water consumption stats:", error);
    return { success: false, error: "Failed to fetch water consumption stats" };
  }
}

