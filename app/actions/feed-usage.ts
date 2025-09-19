"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

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
  cost?: number;
  notes?: string;
  recordedById?: string;
}) {
  try {
    const usage = await prisma.feedUsage.create({
      data,
      include: {
        flock: true,
        feed: true,
        recordedBy: true,
      },
    });
    revalidatePath("/feed");
    return { success: true, data: usage };
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
  cost?: number;
  notes?: string;
  recordedById?: string;
}) {
  try {
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
  } catch (error) {
    console.error("Error updating feed usage:", error);
    return { success: false, error: "Failed to update feed usage record" };
  }
}

export async function deleteFeedUsageAction(id: string) {
  try {
    await prisma.feedUsage.delete({
      where: { id },
    });
    revalidatePath("/feed");
    return { success: true };
  } catch (error) {
    console.error("Error deleting feed usage:", error);
    return { success: false, error: "Failed to delete feed usage record" };
  }
}
