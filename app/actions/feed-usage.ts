"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
  feedId: string;
  date: Date;
  amountUsed: number;
  unit: string;
  notes?: string;
}) {
  try {
    // Get current user from session using better-auth API
    const session = await auth.api.getSession({ headers: await headers() });
    const currentUserId = session?.user?.id;

    // Check if there's enough inventory
    const feed = await prisma.feedInventory.findUnique({
      where: { id: data.feedId },
    });

    if (!feed) {
      return { success: false, error: "Feed not found" };
    }

    if (feed.quantity < data.amountUsed) {
      return { 
        success: false, 
        error: `Insufficient inventory. Available: ${feed.quantity} ${feed.unit}, Required: ${data.amountUsed} ${data.unit}` 
      };
    }

    // Create usage record and update inventory in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the usage record with current user as recordedById
      const usage = await tx.feedUsage.create({
        data: {
          ...data,
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
        where: { id: data.feedId },
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
  feedId?: string;
  date?: Date;
  amountUsed?: number;
  unit?: string;
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
            error: `Insufficient inventory. Available: ${feed?.quantity || 0} ${feed?.unit || 'kg'}, Required increase: ${difference} ${originalUsage.unit}` 
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
