"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function createWeightSampling(data: {
  flockId: string;
  date: Date;
  sampleSize: number;
  sampleWeights: number[];
  totalWeight: number;
  notes?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate flock exists
    const flock = await prisma.flocks.findUnique({
      where: { id: data.flockId },
      select: { id: true, batchCode: true, currentCount: true }
    });

    if (!flock) {
      return { success: false, error: "Flock not found" };
    }

    // Validate sample size
    if (data.sampleSize <= 0 || data.sampleSize > flock.currentCount) {
      return { success: false, error: "Invalid sample size" };
    }

    // Validate sample weights array
    if (!data.sampleWeights || data.sampleWeights.length === 0) {
      return { success: false, error: "Sample weights are required" };
    }

    if (data.sampleWeights.length !== data.sampleSize) {
      return { success: false, error: "Number of sample weights must match sample size" };
    }

    // Validate all sample weights are positive
    if (data.sampleWeights.some(weight => weight <= 0)) {
      return { success: false, error: "All sample weights must be greater than 0" };
    }

    // Validate total weight matches sum of sample weights
    const calculatedTotalWeight = data.sampleWeights.reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(calculatedTotalWeight - data.totalWeight) > 0.01) {
      return { success: false, error: "Total weight must match sum of sample weights" };
    }

    const averageWeight = data.totalWeight / data.sampleSize;
    
    const sampling = await prisma.weightSampling.create({
      data: {
        flockId: data.flockId,
        date: data.date,
        sampleSize: data.sampleSize,
        sampleWeights: data.sampleWeights,
        totalWeight: data.totalWeight,
        averageWeight: averageWeight,
        notes: data.notes,
        recordedById: session.user.id
      },
      include: {
        flock: {
          select: { batchCode: true, currentCount: true }
        },
        recordedBy: {
          select: { name: true }
        }
      }
    });
    
    revalidatePath("/feed");
    return { success: true, data: sampling };
  } catch (error) {
    console.error("Error creating weight sampling:", error);
    return { success: false, error: "Failed to create weight sampling" };
  }
}

export async function getWeightSamplingData(flockId?: string, dateRange?: { start: Date; end: Date }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const whereClause: any = {};
    if (flockId) {
      whereClause.flockId = flockId;
    }
    if (dateRange) {
      whereClause.date = { gte: dateRange.start, lte: dateRange.end };
    }
    
    const samplings = await prisma.weightSampling.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: {
        flock: {
          select: { batchCode: true, currentCount: true }
        },
        recordedBy: {
          select: { name: true }
        }
      }
    });
    
    return { success: true, data: samplings };
  } catch (error) {
    console.error("Error fetching weight sampling data:", error);
    return { success: false, error: "Failed to fetch weight sampling data" };
  }
}

export async function getFlockWeightTrend(flockId: string, days: number = 30) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const samplings = await prisma.weightSampling.findMany({
      where: {
        flockId: flockId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        averageWeight: true,
        sampleSize: true,
        totalWeight: true
      }
    });

    return { success: true, data: samplings };
  } catch (error) {
    console.error("Error fetching weight trend:", error);
    return { success: false, error: "Failed to fetch weight trend" };
  }
}

export async function updateWeightSampling(id: string, data: {
  date?: Date;
  sampleSize?: number;
  sampleWeights?: number[];
  totalWeight?: number;
  notes?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get existing sampling record
    const existingSampling = await prisma.weightSampling.findUnique({
      where: { id },
      include: { flock: { select: { currentCount: true } } }
    });

    if (!existingSampling) {
      return { success: false, error: "Weight sampling record not found" };
    }

    // Validate sample size if provided
    if (data.sampleSize && (data.sampleSize <= 0 || data.sampleSize > existingSampling.flock.currentCount)) {
      return { success: false, error: "Invalid sample size" };
    }

    // Validate sample weights array if provided
    if (data.sampleWeights) {
      if (data.sampleWeights.length === 0) {
        return { success: false, error: "Sample weights are required" };
      }

      const sampleSize = data.sampleSize || existingSampling.sampleSize;
      if (data.sampleWeights.length !== sampleSize) {
        return { success: false, error: "Number of sample weights must match sample size" };
      }

      // Validate all sample weights are positive
      if (data.sampleWeights.some(weight => weight <= 0)) {
        return { success: false, error: "All sample weights must be greater than 0" };
      }
    }

    // Validate total weight if provided
    if (data.totalWeight && data.totalWeight <= 0) {
      return { success: false, error: "Total weight must be greater than 0" };
    }

    const updateData: any = { ...data };
    
    // Recalculate total weight and average weight if sample weights changed
    if (data.sampleWeights) {
      const calculatedTotalWeight = data.sampleWeights.reduce((sum, weight) => sum + weight, 0);
      updateData.totalWeight = calculatedTotalWeight;
      updateData.averageWeight = calculatedTotalWeight / (data.sampleSize || existingSampling.sampleSize);
    } else if (data.sampleSize || data.totalWeight) {
      const sampleSize = data.sampleSize || existingSampling.sampleSize;
      const totalWeight = data.totalWeight || existingSampling.totalWeight;
      updateData.averageWeight = totalWeight / sampleSize;
    }

    const updatedSampling = await prisma.weightSampling.update({
      where: { id },
      data: updateData,
      include: {
        flock: {
          select: { batchCode: true, currentCount: true }
        },
        recordedBy: {
          select: { name: true }
        }
      }
    });

    revalidatePath("/feed");
    return { success: true, data: updatedSampling };
  } catch (error) {
    console.error("Error updating weight sampling:", error);
    return { success: false, error: "Failed to update weight sampling" };
  }
}

export async function deleteWeightSampling(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.weightSampling.delete({
      where: { id }
    });

    revalidatePath("/feed");
    return { success: true };
  } catch (error) {
    console.error("Error deleting weight sampling:", error);
    return { success: false, error: "Failed to delete weight sampling" };
  }
}

export async function getWeightSamplingStats(flockId?: string, dateRange?: { start: Date; end: Date }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const whereClause: any = {};
    if (flockId) {
      whereClause.flockId = flockId;
    }
    if (dateRange) {
      whereClause.date = { gte: dateRange.start, lte: dateRange.end };
    }

    const [totalSamplings, avgWeight, latestSampling] = await Promise.all([
      prisma.weightSampling.count({ where: whereClause }),
      prisma.weightSampling.aggregate({
        where: whereClause,
        _avg: { averageWeight: true }
      }),
      prisma.weightSampling.findFirst({
        where: whereClause,
        orderBy: { date: 'desc' },
        include: {
          flock: { select: { batchCode: true } }
        }
      })
    ]);

    return {
      success: true,
      data: {
        totalSamplings,
        averageWeight: avgWeight._avg.averageWeight || 0,
        latestSampling: latestSampling ? {
          date: latestSampling.date,
          averageWeight: latestSampling.averageWeight,
          sampleSize: latestSampling.sampleSize,
          flockBatchCode: latestSampling.flock.batchCode
        } : null
      }
    };
  } catch (error) {
    console.error("Error fetching weight sampling stats:", error);
    return { success: false, error: "Failed to fetch weight sampling stats" };
  }
}

export async function getWeightSamplingWithFCR(flockId?: string, dateRange?: { start: Date; end: Date }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const startDate = dateRange?.start || new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = dateRange?.end || new Date();

    // Get weight sampling data
    const weightSamplings = await prisma.weightSampling.findMany({
      where: {
        ...(flockId && { flockId }),
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' },
      include: {
        flock: {
          select: { batchCode: true, currentCount: true }
        },
        recordedBy: {
          select: { name: true }
        }
      }
    });

    // Get feed usage data for the same period
    const feedUsageData = await prisma.feedUsage.findMany({
      where: {
        ...(flockId && { flockId }),
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' }
    });

    // Get the first recording date for each flock from the entire database
    const uniqueFlockIds = [...new Set(weightSamplings.map(s => s.flockId))];
    const flockFirstRecordings = new Map<string, Date>();
    
    for (const flockId of uniqueFlockIds) {
      const firstRecording = await prisma.weightSampling.findFirst({
        where: { flockId },
        orderBy: { date: 'asc' },
        select: { date: true }
      });
      
      if (firstRecording) {
        flockFirstRecordings.set(flockId, firstRecording.date);
      }
    }

    // Calculate FCR for each weight sampling record
    const weightSamplingsWithFCR = weightSamplings.map((sampling, index) => {
      let fcrLifetime = 0;
      let fcrPrevious = 0;
      let weightGainLifetime = 0;
      let weightGainPrevious = 0;

      // Check if this is the first recording for this specific flock
      const isFirstRecordingForFlock = flockFirstRecordings.get(sampling.flockId)?.getTime() === sampling.date.getTime();

      if (isFirstRecordingForFlock) {
        // First recording for this flock - no FCR calculation
        fcrLifetime = 0;
        fcrPrevious = 0;
      } else {
        // Calculate lifetime FCR (from first recording to current)
        const firstSampling = weightSamplings[0];
        const currentSampling = sampling;
        
        // Get feed used from first recording to current
        const feedUsedLifetime = feedUsageData
          .filter(feed => feed.date >= firstSampling.date && feed.date <= currentSampling.date)
          .reduce((sum, feed) => sum + feed.amountUsed, 0);

        // Calculate weight gain from first to current
        const flockSize = firstSampling.flock.currentCount;
        if (flockSize > 0) {
          const initialTotalWeight = firstSampling.averageWeight * flockSize;
          const currentTotalWeight = currentSampling.averageWeight * flockSize;
          weightGainLifetime = currentTotalWeight - initialTotalWeight;
          fcrLifetime = weightGainLifetime > 0 ? feedUsedLifetime / weightGainLifetime : 0;
        }

        // Calculate FCR from previous recording
        const previousSampling = weightSamplings[index - 1];
        
        // Get feed used from previous recording to current
        const feedUsedPrevious = feedUsageData
          .filter(feed => feed.date > previousSampling.date && feed.date <= currentSampling.date)
          .reduce((sum, feed) => sum + feed.amountUsed, 0);

        // Calculate weight gain from previous to current
        if (flockSize > 0) {
          const previousTotalWeight = previousSampling.averageWeight * flockSize;
          const currentTotalWeight = currentSampling.averageWeight * flockSize;
          weightGainPrevious = currentTotalWeight - previousTotalWeight;
          fcrPrevious = weightGainPrevious > 0 ? feedUsedPrevious / weightGainPrevious : 0;
        }
      }

      return {
        id: sampling.id,
        flockId: sampling.flockId,
        date: sampling.date,
        sampleSize: sampling.sampleSize,
        sampleWeights: sampling.sampleWeights,
        totalWeight: sampling.totalWeight,
        averageWeight: sampling.averageWeight,
        notes: sampling.notes,
        flock: sampling.flock,
        recordedBy: sampling.recordedBy,
        fcrLifetime: fcrLifetime,
        fcrPrevious: fcrPrevious,
        weightGainLifetime: weightGainLifetime,
        weightGainPrevious: weightGainPrevious,
        isFirstRecording: isFirstRecordingForFlock
      };
    });

    return {
      success: true,
      data: weightSamplingsWithFCR
    };
  } catch (error) {
    console.error("Error getting weight sampling with FCR:", error);
    return { success: false, error: "Failed to get weight sampling with FCR" };
  }
}

