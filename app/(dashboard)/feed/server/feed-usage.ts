"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-middleware";

export async function getFeedUsageAction() {
  try {
    const usage = await prisma.feedUsage.findMany({
      include: {
        flock: true,
        feed: true,
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

    // Get feed recommendation for this flock
    const feedRecommendation = await prisma.feedProgram.findFirst({
      where: {
        ageInWeeks: flock.ageInWeeks,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!feedRecommendation) {
      return { success: false, error: "No feed program found for this flock's age" };
    }

    // Find active feed inventory for the recommended feed type
    const feed = await prisma.feedInventory.findFirst({
      where: { 
        feedType: feedRecommendation.feedType,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!feed) {
      return { success: false, error: `No active inventory found for ${feedRecommendation.feedType} feed` };
    }

    if (feed.quantity < data.amountUsed) {
      return { 
        success: false, 
        error: `Insufficient inventory. Available: ${feed.quantity} kg, Required: ${data.amountUsed} kg` 
      };
    }

    // Create usage record and update inventory in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the usage record with current user as recordedById
      const usage = await tx.feedUsage.create({
        data: {
          flockId: data.flockId,
          feedId: feed.id,
          date: data.date,
          amountUsed: data.amountUsed,
          unit: "KG",
          notes: data.notes,
          recordedById: currentUserId || null,
        },
        include: {
          flock: true,
          feed: true,
          recordedBy: true,
        },
      });

      // Update inventory quantity
      await tx.feedInventory.update({
        where: { id: feed.id },
        data: {
          quantity: {
            decrement: data.amountUsed,
          },
        },
      });

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
      include: { feed: true },
    });

    if (!originalUsage) {
      return { success: false, error: "Usage record not found" };
    }

    // If amountUsed is being changed, we need to adjust inventory
    if (data.amountUsed !== undefined && data.amountUsed !== originalUsage.amountUsed) {
      const difference = data.amountUsed - originalUsage.amountUsed;
      
      // Check if there's enough inventory for the increase
      if (difference > 0) {
        const feed = await prisma.feedInventory.findUnique({
          where: { id: originalUsage.feedId },
        });

        if (!feed || feed.quantity < difference) {
          return { 
            success: false, 
            error: `Insufficient inventory. Available: ${feed?.quantity || 0} kg, Required increase: ${difference} kg` 
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
            feed: true,
            recordedBy: true,
          },
        });

        // Adjust inventory quantity
        await tx.feedInventory.update({
          where: { id: originalUsage.feedId },
          data: {
            quantity: {
              increment: -difference, // Negative difference means we're adding back to inventory
            },
          },
        });

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
          feed: true,
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
      include: { feed: true },
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

      // Restore the inventory quantity
      await tx.feedInventory.update({
        where: { id: usage.feedId },
        data: {
          quantity: {
            increment: usage.amountUsed,
          },
        },
      });
    });

    revalidatePath("/feed");
    return { success: true };
  } catch (error) {
    console.error("Error deleting feed usage:", error);
    return { success: false, error: "Failed to delete feed usage record" };
  }
}
