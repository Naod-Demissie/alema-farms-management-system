"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getFeedConversionRatio(flockId?: string, dateRange?: { start: Date; end: Date }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const startDate = dateRange?.start || new Date(new Date().setDate(new Date().getDate() - 90));
    const endDate = dateRange?.end || new Date();

    // Build where clause
    const whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (flockId) {
      whereClause.flockId = flockId;
    }

    // Get feed usage data
    const feedUsageData = await prisma.feedUsage.aggregate({
      where: whereClause,
      _sum: {
        amountUsed: true,
      },
    });

    // Get weight sampling data for the period
    const weightSamplings = await prisma.weightSampling.findMany({
      where: {
        ...(flockId && { flockId }),
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' }
    });

    // Get flock data for current count
    const flocks = await prisma.flocks.findMany({
      where: flockId ? { id: flockId } : { currentCount: { gt: 0 } },
      select: { id: true, batchCode: true, currentCount: true }
    });

    const totalFeedUsed = feedUsageData._sum.amountUsed || 0;
    
    // Initialize variables for main FCR calculation
    let totalWeightGain = 0;
    let hasWeightData = false;
    let weightGainDetails = {
      initialWeight: 0,
      finalWeight: 0,
      weightGain: 0,
      sampleCount: weightSamplings.length,
      firstSamplingDate: null as Date | null,
      lastSamplingDate: null as Date | null,
      averageDailyGain: 0,
      initialAverageWeight: 0,
      finalAverageWeight: 0
    };

    // Only calculate main FCR if a specific flock is selected
    // This ensures FCR is calculated per flock, not across all flocks
    if (flockId && weightSamplings.length >= 2) {
      const firstSampling = weightSamplings[0];
      const lastSampling = weightSamplings[weightSamplings.length - 1];
      
      // Find flock for current count
      const flock = flocks.find(f => f.id === flockId);
      const currentFlockSize = flock?.currentCount || 0;
      
      if (currentFlockSize > 0) {
        // Calculate total flock weight at start and end
        const initialTotalWeight = firstSampling.averageWeight * currentFlockSize;
        const finalTotalWeight = lastSampling.averageWeight * currentFlockSize;
        
        totalWeightGain = finalTotalWeight - initialTotalWeight;
        hasWeightData = true;

        // Store detailed weight gain information
        weightGainDetails = {
          initialWeight: initialTotalWeight,
          finalWeight: finalTotalWeight,
          weightGain: totalWeightGain,
          sampleCount: weightSamplings.length,
          firstSamplingDate: firstSampling.date,
          lastSamplingDate: lastSampling.date,
          averageDailyGain: 0,
          initialAverageWeight: firstSampling.averageWeight,
          finalAverageWeight: lastSampling.averageWeight
        };

        // Calculate average daily weight gain
        const daysBetween = Math.max(1, Math.ceil((lastSampling.date.getTime() - firstSampling.date.getTime()) / (1000 * 60 * 60 * 24)));
        weightGainDetails.averageDailyGain = totalWeightGain / daysBetween;
      }
    }

    // Calculate FCR (Feed Conversion Ratio) - only for specific flock
    // FCR = Feed consumed (kg) / Weight gain (kg)
    const fcr = totalWeightGain > 0 ? totalFeedUsed / totalWeightGain : 0;

    // Get per-flock breakdown - always calculate per-flock FCR
    // This ensures each flock's FCR is calculated independently
    let perFlockData = [];
    if (!flockId) {
      const flocks = await prisma.flocks.findMany({
        where: {
          currentCount: { gt: 0 },
        },
        select: {
          id: true,
          batchCode: true,
          currentCount: true,
        },
      });

      perFlockData = await Promise.all(
        flocks.map(async (flock) => {
          const flockFeed = await prisma.feedUsage.aggregate({
            where: {
              flockId: flock.id,
              date: { gte: startDate, lte: endDate },
            },
            _sum: { amountUsed: true },
          });

          const flockWeightSamplings = await prisma.weightSampling.findMany({
            where: {
              flockId: flock.id,
              date: { gte: startDate, lte: endDate },
            },
            orderBy: { date: 'asc' }
          });

          let flockWeightGain = 0;
          let hasFlockWeightData = false;

          if (flockWeightSamplings.length >= 2) {
            const firstSampling = flockWeightSamplings[0];
            const lastSampling = flockWeightSamplings[flockWeightSamplings.length - 1];
            
            const initialTotalWeight = firstSampling.averageWeight * flock.currentCount;
            const finalTotalWeight = lastSampling.averageWeight * flock.currentCount;
            flockWeightGain = finalTotalWeight - initialTotalWeight;
            hasFlockWeightData = true;
          }

          const flockFeedUsed = flockFeed._sum.amountUsed || 0;
          const flockFCR = flockWeightGain > 0 ? flockFeedUsed / flockWeightGain : 0;

          return {
            flockId: flock.id,
            batchCode: flock.batchCode,
            feedUsed: flockFeedUsed,
            weightGain: flockWeightGain,
            fcr: flockFCR,
            hasWeightData: hasFlockWeightData,
            sampleCount: flockWeightSamplings.length,
            initialWeight: hasFlockWeightData ? flockWeightSamplings[0].averageWeight * flock.currentCount : 0,
            finalWeight: hasFlockWeightData ? flockWeightSamplings[flockWeightSamplings.length - 1].averageWeight * flock.currentCount : 0,
            averageDailyGain: hasFlockWeightData && flockWeightSamplings.length >= 2 ? 
              flockWeightGain / Math.max(1, Math.ceil((flockWeightSamplings[flockWeightSamplings.length - 1].date.getTime() - flockWeightSamplings[0].date.getTime()) / (1000 * 60 * 60 * 24))) : 0,
          };
        })
      );
    }

    // Get weight sampling data for insights
    const weightSamplingInsights = weightSamplings.map(sampling => ({
      date: sampling.date,
      averageWeight: sampling.averageWeight,
      sampleSize: sampling.sampleSize,
      totalWeight: sampling.totalWeight
    }));

    return {
      success: true,
      data: {
        totalFeedUsed,
        weightGain: totalWeightGain,
        fcr,
        hasWeightData,
        sampleCount: weightSamplings.length,
        perFlockData,
        weightGainDetails,
        weightSamplingInsights,
        weightSamplings: weightSamplings.map(s => ({
          date: s.date,
          averageWeight: s.averageWeight,
          sampleSize: s.sampleSize,
          totalWeight: s.totalWeight
        }))
      },
    };
  } catch (error) {
    console.error("Error calculating feed conversion ratio:", error);
    return { success: false, error: "Failed to calculate feed conversion ratio" };
  }
}

export async function getFeedEfficiencyStats() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get this month's data
    const [monthFeed, monthWeightSamplings, totalFlocks] = await Promise.all([
      prisma.feedUsage.aggregate({
        where: { date: { gte: monthStart } },
        _sum: { amountUsed: true },
      }),
      prisma.weightSampling.findMany({
        where: { date: { gte: monthStart } },
        orderBy: { date: 'asc' },
        include: {
          flock: { select: { currentCount: true } }
        }
      }),
      prisma.flocks.count({
        where: { currentCount: { gt: 0 } },
      }),
    ]);

    const feedUsed = monthFeed._sum.amountUsed || 0;
    
    // Calculate monthly weight gain from sampling data
    let monthlyWeightGain = 0;
    let hasMonthlyWeightData = false;
    
    if (monthWeightSamplings.length >= 2) {
      // Group by flock and calculate weight gain for each
      const flockGroups = monthWeightSamplings.reduce((acc, sampling) => {
        if (!acc[sampling.flockId]) {
          acc[sampling.flockId] = [];
        }
        acc[sampling.flockId].push(sampling);
        return acc;
      }, {} as Record<string, typeof monthWeightSamplings>);

      for (const flockSamplings of Object.values(flockGroups)) {
        if (flockSamplings.length >= 2) {
          const firstSampling = flockSamplings[0];
          const lastSampling = flockSamplings[flockSamplings.length - 1];
          const flockSize = firstSampling.flock.currentCount;
          
          if (flockSize > 0) {
            const initialWeight = firstSampling.averageWeight * flockSize;
            const finalWeight = lastSampling.averageWeight * flockSize;
            monthlyWeightGain += (finalWeight - initialWeight);
            hasMonthlyWeightData = true;
          }
        }
      }
    }

    const monthlyFCR = monthlyWeightGain > 0 ? feedUsed / monthlyWeightGain : 0;

    // Get average daily feed per bird
    const totalBirds = await prisma.flocks.aggregate({
      where: { currentCount: { gt: 0 } },
      _sum: { currentCount: true },
    });

    const birds = totalBirds._sum.currentCount || 0;
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const avgFeedPerBirdPerDay = birds > 0 ? feedUsed / (birds * daysInMonth) : 0;

    return {
      success: true,
      data: {
        monthlyFCR,
        feedUsed,
        monthlyWeightGain,
        hasMonthlyWeightData,
        activeFlocks: totalFlocks,
        avgFeedPerBirdPerDay,
        birds,
        weightSamplingCount: monthWeightSamplings.length,
      },
    };
  } catch (error) {
    console.error("Error getting feed efficiency stats:", error);
    return { success: false, error: "Failed to get feed efficiency stats" };
  }
}

