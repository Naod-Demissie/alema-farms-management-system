"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { FeedType } from "@/lib/generated/prisma";

export async function getFeedProgramAction() {
  try {
    const program = await prisma.feedProgram.findMany({
      orderBy: [
        { ageInWeeks: 'asc' }
      ],
    });
    return { success: true, data: program };
  } catch (error) {
    console.error("Error fetching feed program:", error);
    return { success: false, error: "Failed to fetch feed program" };
  }
}

export async function createFeedProgramAction(data: {
  ageInWeeks: number;
  ageInDays: string;
  feedType: FeedType;
  gramPerHen: number;
}) {
  try {
    const program = await prisma.feedProgram.create({
      data,
    });
    revalidatePath("/feed");
    return { success: true, data: program };
  } catch (error) {
    console.error("Error creating feed program:", error);
    return { success: false, error: "Failed to create feed program entry" };
  }
}

export async function updateFeedProgramAction(id: string, data: {
  ageInWeeks?: number;
  ageInDays?: string;
  feedType?: FeedType;
  gramPerHen?: number;
  isActive?: boolean;
}) {
  try {
    const program = await prisma.feedProgram.update({
      where: { id },
      data,
    });
    revalidatePath("/feed");
    return { success: true, data: program };
  } catch (error) {
    console.error("Error updating feed program:", error);
    return { success: false, error: "Failed to update feed program entry" };
  }
}

export async function deleteFeedProgramAction(id: string) {
  try {
    await prisma.feedProgram.delete({
      where: { id },
    });
    revalidatePath("/feed");
    return { success: true };
  } catch (error) {
    console.error("Error deleting feed program:", error);
    return { success: false, error: "Failed to delete feed program entry" };
  }
}

export async function getFeedRecommendationsAction() {
  try {
    const { getAllFeedRecommendations } = await import("@/lib/feed-program");
    const recommendations = await getAllFeedRecommendations();
    return { success: true, data: recommendations };
  } catch (error) {
    console.error("Error fetching feed recommendations:", error);
    return { success: false, error: "Failed to fetch feed recommendations" };
  }
}

export async function getDailyFeedRequirementsAction() {
  try {
    const { getDailyFeedRequirements } = await import("@/lib/feed-program");
    const requirements = await getDailyFeedRequirements();
    return { success: true, data: requirements };
  } catch (error) {
    console.error("Error fetching daily feed requirements:", error);
    return { success: false, error: "Failed to fetch daily feed requirements" };
  }
}

export async function getWeeklyFeedRequirementsAction() {
  try {
    const { getWeeklyFeedRequirements } = await import("@/lib/feed-program");
    const requirements = await getWeeklyFeedRequirements();
    return { success: true, data: requirements };
  } catch (error) {
    console.error("Error fetching weekly feed requirements:", error);
    return { success: false, error: "Failed to fetch weekly feed requirements" };
  }
}

export async function getFeedComplianceAction(flockId: string, days: number = 7) {
  try {
    const { getFeedCompliance } = await import("@/lib/feed-program");
    const compliance = await getFeedCompliance(flockId, days);
    return { success: true, data: compliance };
  } catch (error) {
    console.error("Error fetching feed compliance:", error);
    return { success: false, error: "Failed to fetch feed compliance" };
  }
}
