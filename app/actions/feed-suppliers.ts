"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getFeedSuppliersAction() {
  try {
    const suppliers = await prisma.feedSupplier.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return { success: true, data: suppliers };
  } catch (error) {
    console.error("Error fetching feed suppliers:", error);
    return { success: false, error: "Failed to fetch feed suppliers" };
  }
}

export async function createFeedSupplierAction(data: {
  name: string;
  contactName?: string;
  phone?: string;
  address?: string;
  notes?: string;
}) {
  try {
    const supplier = await prisma.feedSupplier.create({
      data: {
        ...data,
        isActive: true,
      },
    });
    revalidatePath("/feed");
    return { success: true, data: supplier };
  } catch (error) {
    console.error("Error creating feed supplier:", error);
    return { success: false, error: "Failed to create feed supplier" };
  }
}

export async function updateFeedSupplierAction(id: string, data: {
  name?: string;
  contactName?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}) {
  try {
    const supplier = await prisma.feedSupplier.update({
      where: { id },
      data,
    });
    revalidatePath("/feed");
    return { success: true, data: supplier };
  } catch (error) {
    console.error("Error updating feed supplier:", error);
    return { success: false, error: "Failed to update feed supplier" };
  }
}

export async function deleteFeedSupplierAction(id: string) {
  try {
    await prisma.feedSupplier.delete({
      where: { id },
    });
    revalidatePath("/feed");
    return { success: true };
  } catch (error) {
    console.error("Error deleting feed supplier:", error);
    return { success: false, error: "Failed to delete feed supplier" };
  }
}
