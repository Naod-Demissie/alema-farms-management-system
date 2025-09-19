"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { FeedType } from "@/lib/generated/prisma";

export async function getFeedInventoryAction() {
  try {
    const inventory = await prisma.feedInventory.findMany({
      include: {
        supplier: true,
        feedUsage: {
          include: {
            flock: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return { success: true, data: inventory };
  } catch (error) {
    console.error("Error fetching feed inventory:", error);
    return { success: false, error: "Failed to fetch feed inventory" };
  }
}

export async function createFeedInventoryAction(data: {
  feedType: FeedType;
  supplierId?: string;
  quantity: number;
  unit: string;
  costPerUnit?: number;
  minStock?: number;
  notes?: string;
}) {
  try {
    const feed = await prisma.feedInventory.create({
      data: {
        ...data,
        supplierId: data.supplierId && data.supplierId !== "none" ? data.supplierId : null,
        isActive: true,
      },
      include: {
        supplier: true,
      },
    });
    revalidatePath("/feed");
    return { success: true, data: feed };
  } catch (error) {
    console.error("Error creating feed inventory:", error);
    return { success: false, error: "Failed to create feed inventory" };
  }
}

export async function updateFeedInventoryAction(id: string, data: {
  feedType?: FeedType;
  supplierId?: string;
  quantity?: number;
  unit?: string;
  costPerUnit?: number;
  minStock?: number;
  notes?: string;
  isActive?: boolean;
}) {
  try {
    const feed = await prisma.feedInventory.update({
      where: { id },
      data: {
        ...data,
        supplierId: data.supplierId !== undefined 
          ? (data.supplierId && data.supplierId !== "none" ? data.supplierId : null)
          : undefined,
      },
      include: {
        supplier: true,
      },
    });
    revalidatePath("/feed");
    return { success: true, data: feed };
  } catch (error) {
    console.error("Error updating feed inventory:", error);
    return { success: false, error: "Failed to update feed inventory" };
  }
}

export async function deleteFeedInventoryAction(id: string) {
  try {
    await prisma.feedInventory.delete({
      where: { id },
    });
    revalidatePath("/feed");
    return { success: true };
  } catch (error) {
    console.error("Error deleting feed inventory:", error);
    return { success: false, error: "Failed to delete feed inventory" };
  }
}
