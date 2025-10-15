"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getHealthAnalytics(dateRange?: { start: Date; end: Date }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const startDate = dateRange?.start || new Date(new Date().setDate(new Date().getDate() - 90));
    const endDate = dateRange?.end || new Date();

    // Get all active flocks
    const flocks = await prisma.flocks.findMany({
      where: {
        currentCount: { gt: 0 },
      },
      select: {
        id: true,
        batchCode: true,
        initialCount: true,
        currentCount: true,
        arrivalDate: true,
        ageInDays: true,
      },
    });

    const flockAnalytics = await Promise.all(
      flocks.map(async (flock) => {
        // Get mortality data
        const mortalityData = await prisma.mortality.aggregate({
          where: {
            flockId: flock.id,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: {
            count: true,
          },
        });

        const totalDeaths = mortalityData._sum.count || 0;

        // Get total mortality for the flock (all time)
        const totalMortalityData = await prisma.mortality.aggregate({
          where: {
            flockId: flock.id,
          },
          _sum: {
            count: true,
          },
        });

        const totalDeathsAllTime = totalMortalityData._sum.count || 0;

        // Get treatment data (morbidity)
        const treatmentData = await prisma.treatments.findMany({
          where: {
            flockId: flock.id,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            disease: true,
            diseaseName: true,
            response: true,
            startDate: true,
            endDate: true,
          },
        });

        const activeTreatments = treatmentData.filter((t) => !t.endDate || new Date(t.endDate) > new Date()).length;
        const totalTreatments = treatmentData.length;

        // Calculate mortality rate (based on initial count)
        const mortalityRate = flock.initialCount > 0 ? (totalDeathsAllTime / flock.initialCount) * 100 : 0;

        // Calculate morbidity rate (sick birds / current count)
        // Assuming each treatment represents sick birds, use treatment count as proxy
        const morbidityRate = flock.currentCount > 0 ? (activeTreatments / flock.currentCount) * 100 : 0;

        // Calculate healthy flock percentage
        const healthyPercentage = 100 - mortalityRate - morbidityRate;

        return {
          flockId: flock.id,
          batchCode: flock.batchCode,
          initialCount: flock.initialCount,
          currentCount: flock.currentCount,
          ageInDays: flock.ageInDays || 0,
          totalDeaths,
          totalDeathsAllTime,
          totalTreatments,
          activeTreatments,
          mortalityRate: Math.max(0, Math.min(100, mortalityRate)),
          morbidityRate: Math.max(0, Math.min(100, morbidityRate)),
          healthyPercentage: Math.max(0, healthyPercentage),
          treatments: treatmentData,
        };
      })
    );

    // Calculate overall statistics
    const totalBirds = flocks.reduce((sum, f) => sum + f.currentCount, 0);
    const totalDeaths = flockAnalytics.reduce((sum, f) => sum + f.totalDeathsAllTime, 0);
    const totalActiveTreatments = flockAnalytics.reduce((sum, f) => sum + f.activeTreatments, 0);
    const totalTreatments = flockAnalytics.reduce((sum, f) => sum + f.totalTreatments, 0);

    const overallMortalityRate = totalBirds > 0 ? (totalDeaths / (totalBirds + totalDeaths)) * 100 : 0;
    const overallMorbidityRate = totalBirds > 0 ? (totalActiveTreatments / totalBirds) * 100 : 0;
    const overallHealthyRate = 100 - overallMortalityRate - overallMorbidityRate;

    // Get mortality by cause
    const mortalityByCause = await prisma.mortality.groupBy({
      by: ['cause'],
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        count: true,
      },
    });

    // Get disease distribution
    const diseaseDistribution = await prisma.treatments.groupBy({
      by: ['disease'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        disease: true,
      },
    });

    return {
      success: true,
      data: {
        flockAnalytics: flockAnalytics.filter(f => f.currentCount > 0 || f.totalDeaths > 0),
        overallStats: {
          totalBirds,
          totalDeaths,
          totalActiveTreatments,
          totalTreatments,
          mortalityRate: Math.max(0, Math.min(100, overallMortalityRate)),
          morbidityRate: Math.max(0, Math.min(100, overallMorbidityRate)),
          healthyRate: Math.max(0, overallHealthyRate),
          activeFlocks: flocks.length,
        },
        mortalityByCause: mortalityByCause.map((m) => ({
          cause: m.cause || 'unknown',
          count: m._sum.count || 0,
        })),
        diseaseDistribution: diseaseDistribution.map((d) => ({
          disease: d.disease,
          count: d._count.disease,
        })),
      },
    };
  } catch (error) {
    console.error("Error getting health analytics:", error);
    return { success: false, error: "Failed to get health analytics" };
  }
}

export async function getHealthStats() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get today's deaths
    const todayDeaths = await prisma.mortality.aggregate({
      where: {
        date: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lte: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
      _sum: { count: true },
    });

    // Get this week's deaths
    const weekDeaths = await prisma.mortality.aggregate({
      where: {
        date: { gte: weekStart },
      },
      _sum: { count: true },
    });

    // Get this month's deaths
    const monthDeaths = await prisma.mortality.aggregate({
      where: {
        date: { gte: monthStart },
      },
      _sum: { count: true },
    });

    // Get active treatments count
    const activeTreatments = await prisma.treatments.count({
      where: {
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
    });

    return {
      success: true,
      data: {
        todayDeaths: todayDeaths._sum.count || 0,
        weekDeaths: weekDeaths._sum.count || 0,
        monthDeaths: monthDeaths._sum.count || 0,
        activeTreatments,
      },
    };
  } catch (error) {
    console.error("Error getting health stats:", error);
    return { success: false, error: "Failed to get health stats" };
  }
}

