"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-middleware";
import { InventoryType } from "@/lib/generated/prisma/enums";
import { deductFromInventory, addToInventory } from "./inventory-service";
import { calculateFlockAge } from "../utils/feed-program-server";

export async function getAvailableFeedStockAction() {
  try {
    const inventory = await prisma.inventory.findFirst({
      where: {
        type: InventoryType.FEED,
        isActive: true,
      },
      select: {
        feedDetails: true,
      }
    });

    if (!inventory || !inventory.feedDetails) {
      return { success: true, data: {} };
    }

    const feedDetails = inventory.feedDetails as Record<string, number>;
    return { success: true, data: feedDetails };
  } catch (error) {
    console.error("Error fetching available feed stock:", error);
    return { success: false, error: "Failed to fetch available feed stock" };
  }
}

export async function getFeedUsageAction() {
  try {
    const usage = await prisma.feedUsage.findMany({
      include: {
        flock: true,
        recordedBy: true,
      },
      orderBy: {
        date: "desc",
      },
    });
    
    return { success: true, data: usage };
  } catch (error) {
    console.error("Error fetching feed usage:", error);
    return { success: false, error: "Failed to fetch feed usage records" };
  }
}

export async function createFeedUsageAction(data: {
  flockId: string;
  date: Date;
  amountUsed: number;
  notes?: string;
}) {
  try {
    // Get current user from auth middleware
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return { success: false, error: authResult.message || "Authentication required" };
    }
    const currentUserId = authResult.user?.id;

    // Get flock to determine recommended feed type
    const flock = await prisma.flocks.findUnique({
      where: { id: data.flockId },
    });

    if (!flock) {
      return { success: false, error: "Flock not found" };
    }

    // Calculate flock age in weeks
    const ageInWeeks = calculateFlockAge({
      ...flock,
      ageInDays: flock.ageInDays || 0,
    });

    // Get feed recommendation for this flock
    let feedRecommendation = await prisma.feedProgram.findFirst({
      where: {
        ageInWeeks: ageInWeeks,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // If no exact match found, use the last available program for older flocks
    if (!feedRecommendation) {
      feedRecommendation = await prisma.feedProgram.findFirst({
        where: {
          isActive: true
        },
        orderBy: {
          ageInWeeks: 'desc'
        }
      });
      
      if (!feedRecommendation) {
        return { success: false, error: "No feed program found" };
      }
    }

    // NEW: Check inventory table instead of individual feed-inventory records
    const inventory = await prisma.inventory.findFirst({
      where: {
        type: InventoryType.FEED,
        isActive: true,
      },
    });

    if (!inventory) {
      return { success: false, error: "No feed inventory found" };
    }

    // Check if specific feed type is available
    const feedDetails = inventory.feedDetails as any || {};
    const availableQuantity = feedDetails[feedRecommendation.feedType] || 0;

    if (availableQuantity < data.amountUsed) {
      return { 
        success: false, 
        error: `Insufficient ${feedRecommendation.feedType} inventory. Available: ${availableQuantity} kg, Required: ${data.amountUsed} kg` 
      };
    }

    // Create usage record and update inventory in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the usage record
      const usage = await tx.feedUsage.create({
        data: {
          flockId: data.flockId,
          feedType: feedRecommendation.feedType, // NEW: Store feed type directly
          date: data.date,
          amountUsed: data.amountUsed,
          unit: "KG",
          notes: data.notes,
          recordedById: currentUserId || null,
        },
        include: {
          flock: true,
          recordedBy: true,
        },
      });

      // NEW: Update inventory table instead of individual feed-inventory
      const deductResult = await deductFromInventory(
        InventoryType.FEED,
        data.amountUsed,
        { [feedRecommendation.feedType]: data.amountUsed }
      );

      if (!deductResult.success) {
        throw new Error(deductResult.error || "Failed to deduct from inventory");
      }

      return usage;
    });

    revalidatePath("/feed");
    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating feed usage:", error);
    return { success: false, error: "Failed to create feed usage record" };
  }
}

export async function updateFeedUsageAction(id: string, data: {
  flockId?: string;
  date?: Date;
  amountUsed?: number;
  notes?: string;
  recordedById?: string;
}) {
  try {
    // Get the original usage record
    const originalUsage = await prisma.feedUsage.findUnique({
      where: { id },
    });

    if (!originalUsage) {
      return { success: false, error: "Usage record not found" };
    }

    // If amountUsed is being changed, we need to adjust inventory
    if (data.amountUsed !== undefined && data.amountUsed !== originalUsage.amountUsed) {
      const difference = data.amountUsed - originalUsage.amountUsed;
      
      // Check if there's enough inventory for the increase
      if (difference > 0) {
        const inventory = await prisma.inventory.findFirst({
          where: {
            type: InventoryType.FEED,
            isActive: true,
          },
        });

        if (!inventory) {
          return { 
            success: false, 
            error: "No feed inventory found" 
          };
        }

        const feedDetails = inventory.feedDetails as any || {};
        const availableQuantity = feedDetails[originalUsage.feedType] || 0;

        if (availableQuantity < difference) {
          return { 
            success: false, 
            error: `Insufficient ${originalUsage.feedType} inventory. Available: ${availableQuantity} kg, Required increase: ${difference} kg` 
          };
        }
      }

      // Update usage and adjust inventory in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const usage = await tx.feedUsage.update({
          where: { id },
          data,
          include: {
            flock: true,
            recordedBy: true,
          },
        });

        // Adjust inventory quantity using the inventory service
        const adjustResult = await deductFromInventory(
          InventoryType.FEED,
          -difference, // Negative difference means we're adding back to inventory
          { [originalUsage.feedType]: -difference }
        );

        if (!adjustResult.success) {
          throw new Error(adjustResult.error || "Failed to adjust inventory");
        }

        return usage;
      });

      revalidatePath("/feed");
      return { success: true, data: result };
    } else {
      // No amount change, just update the record
      const usage = await prisma.feedUsage.update({
        where: { id },
        data,
        include: {
          flock: true,
          recordedBy: true,
        },
      });
      revalidatePath("/feed");
      return { success: true, data: usage };
    }
  } catch (error) {
    console.error("Error updating feed usage:", error);
    return { success: false, error: "Failed to update feed usage record" };
  }
}

export async function deleteFeedUsageAction(id: string) {
  try {
    // Get the usage record to restore inventory
    const usage = await prisma.feedUsage.findUnique({
      where: { id },
      include: { },
    });

    if (!usage) {
      return { success: false, error: "Usage record not found" };
    }

    // Delete usage and restore inventory in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete the usage record
      await tx.feedUsage.delete({
        where: { id },
      });

      // Restore the inventory quantity using the inventory service
      const restoreResult = await addToInventory(
        InventoryType.FEED,
        usage.amountUsed,
        { [usage.feedType]: usage.amountUsed }
      );

      if (!restoreResult.success) {
        throw new Error(restoreResult.error || "Failed to restore inventory");
      }
    });

    revalidatePath("/feed");
    return { success: true };
  } catch (error) {
    console.error("Error deleting feed usage:", error);
    return { success: false, error: "Failed to delete feed usage record" };
  }
}
