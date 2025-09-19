"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getFlocksAction() {
  try {
    const flocks = await prisma.flocks.findMany({
      orderBy: {
        arrivalDate: "desc",
      },
    });
    return { success: true, data: flocks };
  } catch (error) {
    console.error("Error fetching flocks:", error);
    return { success: false, error: "Failed to fetch flocks" };
  }
}
