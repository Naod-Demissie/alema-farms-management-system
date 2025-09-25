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
    const inventory = await prisma.inventory.findMany({
      where: {
        isActive: true,
      },
    });

    const counts: InventoryCounts = {
      eggs: 0,
      feed: 0,
      medicine: 0,
      broilers: 0,
      manure: 0,
    };

    inventory.forEach(item => {
      switch (item.type) {
        case InventoryType.EGG:
          counts.eggs += item.eggCount || 0;
          break;
        case InventoryType.FEED:
          counts.feed += item.quantity;
          break;
        case InventoryType.MEDICINE:
          counts.medicine += item.quantity;
          break;
        case InventoryType.BROILER:
          counts.broilers += item.broilerCount || 0;
          break;
        case InventoryType.MANURE:
          counts.manure += item.manureWeight || 0;
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
