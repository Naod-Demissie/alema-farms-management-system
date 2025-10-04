"use server";

import { prisma } from "@/lib/prisma";
import { InventoryType } from "@/lib/generated/prisma";

export interface InventoryCounts {
  eggs: number;
  feed: number;
  medicine: number;
  broilers: number;
  manure: number;
}

export async function getInventoryCounts(): Promise<InventoryCounts> {
  try {
    // Use optimized query with aggregation instead of fetching all records
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
