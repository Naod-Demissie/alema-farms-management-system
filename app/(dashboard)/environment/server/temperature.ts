"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function getTemperatureRecords(flockId?: string) {
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

    const records = await prisma.temperatureReading.findMany({
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
    console.error("Error fetching temperature records:", error);
    return { success: false, error: "Failed to fetch temperature records" };
  }
}

export async function createTemperatureRecord(data: {
  flockId: string;
  date: Date;
  minTemp: number;
  maxTemp: number;
  notes?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const avgTemp = (data.minTemp + data.maxTemp) / 2;

    const record = await prisma.temperatureReading.create({
      data: {
        flockId: data.flockId,
        date: data.date,
        minTemp: data.minTemp,
        maxTemp: data.maxTemp,
        avgTemp,
        notes: data.notes,
        recordedById: session.user.id,
      },
    });

    revalidatePath("/environment");
    return { success: true, data: record };
  } catch (error) {
    console.error("Error creating temperature record:", error);
    return { success: false, error: "Failed to create temperature record" };
  }
}

export async function updateTemperatureRecord(
  id: string,
  data: {
    flockId?: string;
    date?: Date;
    minTemp?: number;
    maxTemp?: number;
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

    const updateData: any = { ...data };
    
    if (data.minTemp !== undefined && data.maxTemp !== undefined) {
      updateData.avgTemp = (data.minTemp + data.maxTemp) / 2;
    }

    const record = await prisma.temperatureReading.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/environment");
    return { success: true, data: record };
  } catch (error) {
    console.error("Error updating temperature record:", error);
    return { success: false, error: "Failed to update temperature record" };
  }
}

export async function deleteTemperatureRecord(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.temperatureReading.delete({
      where: { id },
    });

    revalidatePath("/environment");
    return { success: true };
  } catch (error) {
    console.error("Error deleting temperature record:", error);
    return { success: false, error: "Failed to delete temperature record" };
  }
}

export async function getTemperatureStats() {
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
    const todayAvg = await prisma.temperatureReading.aggregate({
      where: {
        date: {
          gte: today,
        },
      },
      _avg: {
        avgTemp: true,
        minTemp: true,
        maxTemp: true,
      },
    });

    // Week's average
    const weekAvg = await prisma.temperatureReading.aggregate({
      where: {
        date: {
          gte: weekStart,
        },
      },
      _avg: {
        avgTemp: true,
        minTemp: true,
        maxTemp: true,
      },
    });

    // Month's average
    const monthAvg = await prisma.temperatureReading.aggregate({
      where: {
        date: {
          gte: monthStart,
        },
      },
      _avg: {
        avgTemp: true,
        minTemp: true,
        maxTemp: true,
      },
    });

    // Total records
    const totalRecords = await prisma.temperatureReading.count();

    return {
      success: true,
      data: {
        today: {
          avg: todayAvg._avg.avgTemp || 0,
          min: todayAvg._avg.minTemp || 0,
          max: todayAvg._avg.maxTemp || 0,
        },
        week: {
          avg: weekAvg._avg.avgTemp || 0,
          min: weekAvg._avg.minTemp || 0,
          max: weekAvg._avg.maxTemp || 0,
        },
        month: {
          avg: monthAvg._avg.avgTemp || 0,
          min: monthAvg._avg.minTemp || 0,
          max: monthAvg._avg.maxTemp || 0,
        },
        totalRecords,
      },
    };
  } catch (error) {
    console.error("Error fetching temperature stats:", error);
    return { success: false, error: "Failed to fetch temperature stats" };
  }
}

