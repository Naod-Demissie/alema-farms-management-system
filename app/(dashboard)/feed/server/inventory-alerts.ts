"use server";

import { prisma } from "@/lib/prisma";
import { InventoryType } from "@/lib/generated/prisma/enums";

export interface EggBreakdown {
  normal: number;
  cracked: number;
  spoiled: number;
  total: number;
}

export interface FeedBreakdown {
  [key: string]: number;
  total: number;
}

export interface InventoryCounts {
  eggs: number;
  feed: number;
  medicine: number;
  broilers: number;
  manure: number;
  eggBreakdown?: EggBreakdown;
  feedBreakdown?: FeedBreakdown;
}

export async function getInventoryCounts(): Promise<InventoryCounts> {
  try {
    // Get basic inventory aggregates
    const inventoryAggregates = await prisma.inventory.groupBy({
      by: ['type'],
      where: {
        isActive: true,
      },
      _sum: {
        quantity: true,
        eggCount: true,
        broilerCount: true,
        manureWeight: true,
      },
    });

    const counts: InventoryCounts = {
      eggs: 0,
      feed: 0,
      medicine: 0,
      broilers: 0,
      manure: 0,
    };

    inventoryAggregates.forEach(aggregate => {
      switch (aggregate.type) {
        case InventoryType.EGG:
          counts.eggs += aggregate._sum.eggCount || 0;
          break;
        case InventoryType.FEED:
          counts.feed += aggregate._sum.quantity || 0;
          break;
        case InventoryType.MEDICINE:
          counts.medicine += aggregate._sum.quantity || 0;
          break;
        case InventoryType.BROILER:
          counts.broilers += aggregate._sum.broilerCount || 0;
          break;
        case InventoryType.MANURE:
          counts.manure += aggregate._sum.manureWeight || 0;
          break;
      }
    });

    // Get detailed egg breakdown from recent production records
    const eggProduction = await prisma.eggProduction.findMany({
      where: {
        date: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
        }
      },
      select: {
        gradeCounts: true,
      }
    });

    const eggBreakdown: EggBreakdown = {
      normal: 0,
      cracked: 0,
      spoiled: 0,
      total: 0,
    };

    eggProduction.forEach(record => {
      const grades = record.gradeCounts as { normal: number; cracked: number; spoiled: number } || {};
      eggBreakdown.normal += grades.normal || 0;
      eggBreakdown.cracked += grades.cracked || 0;
      eggBreakdown.spoiled += grades.spoiled || 0;
    });

    eggBreakdown.total = eggBreakdown.normal + eggBreakdown.cracked + eggBreakdown.spoiled;

    // Get detailed feed breakdown from Inventory table
    const feedInventoryRecord = await prisma.inventory.findFirst({
      where: {
        type: InventoryType.FEED,
        isActive: true,
      },
      select: {
        feedDetails: true,
      }
    });

    const feedBreakdown: FeedBreakdown = {
      total: 0,
    };

    if (feedInventoryRecord && feedInventoryRecord.feedDetails) {
      const feedDetails = feedInventoryRecord.feedDetails as Record<string, number>;
      Object.entries(feedDetails).forEach(([feedType, quantity]) => {
        feedBreakdown[feedType] = quantity;
        feedBreakdown.total += quantity;
      });
    }

    counts.eggBreakdown = eggBreakdown;
    counts.feedBreakdown = feedBreakdown;

    return counts;
  } catch (error) {
    console.error("Error fetching inventory counts:", error);
    return {
      eggs: 0,
      feed: 0,
      medicine: 0,
      broilers: 0,
      manure: 0,
    };
  }
}
