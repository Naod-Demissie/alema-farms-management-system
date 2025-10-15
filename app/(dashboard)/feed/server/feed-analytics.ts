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

    // Get egg production data
    const eggProductionData = await prisma.eggProduction.aggregate({
      where: whereClause,
      _sum: {
        totalCount: true,
      },
    });

    // Get broiler production data
    const broilerProductionData = await prisma.broilerProduction.aggregate({
      where: whereClause,
      _sum: {
        quantity: true,
      },
    });

    const totalFeedUsed = feedUsageData._sum.amountUsed || 0;
    const totalEggs = eggProductionData._sum.totalCount || 0;
    const totalBroilers = broilerProductionData._sum.quantity || 0;

    // Calculate egg mass (assuming 1 egg = 60g = 0.06kg)
    const eggMassKg = totalEggs * 0.06;
    
    // Calculate broiler mass (assuming average broiler weight is 2kg)
    const broilerMassKg = totalBroilers * 2;

    // Total production mass
    const totalProductionMass = eggMassKg + broilerMassKg;

    // Calculate FCR (Feed Conversion Ratio)
    // FCR = Feed consumed (kg) / Production output (kg)
    const fcr = totalProductionMass > 0 ? totalFeedUsed / totalProductionMass : 0;

    // Get per-flock breakdown if no specific flock selected
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

          const flockEggs = await prisma.eggProduction.aggregate({
            where: {
              flockId: flock.id,
              date: { gte: startDate, lte: endDate },
            },
            _sum: { totalCount: true },
          });

          const flockBroilers = await prisma.broilerProduction.aggregate({
            where: {
              flockId: flock.id,
              date: { gte: startDate, lte: endDate },
            },
            _sum: { quantity: true },
          });

          const flockFeedUsed = flockFeed._sum.amountUsed || 0;
          const flockEggCount = flockEggs._sum.totalCount || 0;
          const flockBroilerCount = flockBroilers._sum.quantity || 0;
          const flockEggMass = flockEggCount * 0.06;
          const flockBroilerMass = flockBroilerCount * 2;
          const flockTotalMass = flockEggMass + flockBroilerMass;
          const flockFCR = flockTotalMass > 0 ? flockFeedUsed / flockTotalMass : 0;

          return {
            flockId: flock.id,
            batchCode: flock.batchCode,
            feedUsed: flockFeedUsed,
            eggCount: flockEggCount,
            broilerCount: flockBroilerCount,
            productionMass: flockTotalMass,
            fcr: flockFCR,
          };
        })
      );
    }

    // Get daily FCR trend
    const dailyData = flockId
      ? await prisma.$queryRaw<Array<{
          date: Date;
          feed_used: number;
          eggs_produced: number;
        }>>`
          SELECT 
            DATE(fu.date) as date,
            COALESCE(SUM(fu."amountUsed"), 0) as feed_used,
            COALESCE(SUM(ep."totalCount"), 0) as eggs_produced
          FROM feed_usage fu
          LEFT JOIN egg_production ep ON DATE(fu.date) = DATE(ep.date) AND ep."flockId" = ${flockId}
          WHERE fu.date >= ${startDate} AND fu.date <= ${endDate} AND fu."flockId" = ${flockId}
          GROUP BY DATE(fu.date)
          ORDER BY DATE(fu.date) DESC
          LIMIT 30
        `
      : await prisma.$queryRaw<Array<{
          date: Date;
          feed_used: number;
          eggs_produced: number;
        }>>`
          SELECT 
            DATE(fu.date) as date,
            COALESCE(SUM(fu."amountUsed"), 0) as feed_used,
            COALESCE(SUM(ep."totalCount"), 0) as eggs_produced
          FROM feed_usage fu
          LEFT JOIN egg_production ep ON DATE(fu.date) = DATE(ep.date)
          WHERE fu.date >= ${startDate} AND fu.date <= ${endDate}
          GROUP BY DATE(fu.date)
          ORDER BY DATE(fu.date) DESC
          LIMIT 30
        `;

    const trendData = dailyData.map((d) => {
      const eggMass = Number(d.eggs_produced) * 0.06;
      const dailyFCR = eggMass > 0 ? Number(d.feed_used) / eggMass : 0;
      return {
        date: new Date(d.date).toISOString().split('T')[0],
        feedUsed: Number(d.feed_used),
        production: Number(d.eggs_produced),
        fcr: dailyFCR,
      };
    }).reverse();

    return {
      success: true,
      data: {
        totalFeedUsed,
        totalEggs,
        totalBroilers,
        eggMassKg,
        broilerMassKg,
        totalProductionMass,
        fcr,
        perFlockData,
        trendData,
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
    const [monthFeed, monthEggs, totalFlocks] = await Promise.all([
      prisma.feedUsage.aggregate({
        where: { date: { gte: monthStart } },
        _sum: { amountUsed: true },
      }),
      prisma.eggProduction.aggregate({
        where: { date: { gte: monthStart } },
        _sum: { totalCount: true },
      }),
      prisma.flocks.count({
        where: { currentCount: { gt: 0 } },
      }),
    ]);

    const feedUsed = monthFeed._sum.amountUsed || 0;
    const eggsProduced = monthEggs._sum.totalCount || 0;
    const eggMass = eggsProduced * 0.06;
    const monthlyFCR = eggMass > 0 ? feedUsed / eggMass : 0;

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
        eggsProduced,
        activeFlocks: totalFlocks,
        avgFeedPerBirdPerDay,
        birds,
      },
    };
  } catch (error) {
    console.error("Error getting feed efficiency stats:", error);
    return { success: false, error: "Failed to get feed efficiency stats" };
  }
}

