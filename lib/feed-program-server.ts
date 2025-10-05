// lib/feed-program-server.ts
// Server-side only functions for feed program calculations
import { prisma } from "@/lib/prisma";
import { FeedType } from "@/lib/generated/prisma/enums";

export interface Flock {
  id: string;
  batchCode: string;
  arrivalDate: Date;
  currentCount: number;
  ageInDays?: number;
}

export interface FeedRecommendation {
  feedType: FeedType;
  gramPerHen: number;
  totalAmountKg: number;
  ageInWeeks: number;
  ageInDays: string;
  isTransitionWeek: boolean;
  nextFeedType?: FeedType;
  nextTransitionWeek?: number;
}

/**
 * Calculate current flock age in weeks
 */
export function calculateFlockAge(flock: Flock): number {
  const arrivalDate = new Date(flock.arrivalDate);
  const ageAtArrival = flock.ageInDays || 0;
  const today = new Date();
  const daysSinceArrival = Math.floor((today.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalAgeInDays = ageAtArrival + daysSinceArrival;
  return Math.floor(totalAgeInDays / 7);
}

/**
 * Get recommended feed for a specific flock based on its age
 */
export async function getFeedRecommendation(flockId: string): Promise<FeedRecommendation | null> {
  try {
    const flockData = await prisma.flocks.findUnique({ 
      where: { id: flockId },
      select: { 
        id: true,
        batchCode: true,
        arrivalDate: true,
        currentCount: true,
        ageInDays: true,
      }
    });

    if (!flockData) {
      throw new Error('Flock not found');
    }

    const flock: Flock = {
      ...flockData,
      ageInDays: flockData.ageInDays ?? undefined,
    };

    const ageInWeeks = calculateFlockAge(flock);
    
    // Get current week's program
    const currentProgram = await prisma.feedProgram.findFirst({
      where: { 
        ageInWeeks: ageInWeeks,
        isActive: true
      }
    });

    if (!currentProgram) {
      // For flocks older than the program, use the last available program (22 weeks)
      const lastProgram = await prisma.feedProgram.findFirst({
        where: { 
          isActive: true
        },
        orderBy: { ageInWeeks: 'desc' }
      });
      
      if (!lastProgram) {
        console.warn(`No feed program found at ${ageInWeeks} weeks`);
        return null;
      }
      
      // Use the last program (22 weeks) for older flocks
      return {
        feedType: lastProgram.feedType,
        gramPerHen: lastProgram.gramPerHen,
        totalAmountKg: (lastProgram.gramPerHen * flock.currentCount) / 1000,
        ageInWeeks,
        ageInDays: `${ageInWeeks * 7}-${(ageInWeeks + 1) * 7 - 1}`,
        isTransitionWeek: false,
        nextFeedType: undefined,
        nextTransitionWeek: undefined,
      };
    }

    // Get next week's program to check for transitions
    const nextProgram = await prisma.feedProgram.findFirst({
      where: { 
        ageInWeeks: ageInWeeks + 1,
        isActive: true
      }
    });

    const isTransitionWeek = nextProgram && nextProgram.feedType !== currentProgram.feedType;
    const nextFeedType = isTransitionWeek ? nextProgram?.feedType : undefined;
    const nextTransitionWeek = isTransitionWeek ? ageInWeeks + 1 : undefined;

    return {
      feedType: currentProgram.feedType,
      gramPerHen: currentProgram.gramPerHen,
      totalAmountKg: (currentProgram.gramPerHen * flock.currentCount) / 1000, // Convert to kg
      ageInWeeks,
      ageInDays: currentProgram.ageInDays,
      isTransitionWeek: !!isTransitionWeek,
      nextFeedType,
      nextTransitionWeek,
    };
  } catch (error) {
    console.error('Error getting feed recommendation:', error);
    return null;
  }
}

/**
 * Get feed recommendations for all active flocks
 * Optimized to avoid N+1 queries by fetching all feed programs at once
 */
export async function getAllFeedRecommendations(): Promise<Array<{
  flock: Flock;
  recommendation: FeedRecommendation;
}>> {
  try {
    // Fetch flocks and feed programs in parallel
    const [flocksData, feedPrograms] = await Promise.all([
      prisma.flocks.findMany({
        where: { currentCount: { gt: 0 } },
        select: {
          id: true,
          batchCode: true,
          arrivalDate: true,
          currentCount: true,
          ageInDays: true,
        }
      }),
      prisma.feedProgram.findMany({
        where: { isActive: true },
        orderBy: { ageInWeeks: 'asc' }
      })
    ]);

    // Convert flocks data to proper interface
    const flocks: Flock[] = flocksData.map(flockData => ({
      ...flockData,
      ageInDays: flockData.ageInDays ?? undefined,
    }));

    // Create a map for O(1) lookup of feed programs by age
    const programMap = new Map<number, typeof feedPrograms[0]>();
    feedPrograms.forEach(program => {
      programMap.set(program.ageInWeeks, program);
    });

    // Get the last program for flocks older than the program
    const lastProgram = feedPrograms[feedPrograms.length - 1];

    // Process all flocks without additional database queries
    const recommendations = flocks.map(flock => {
      const ageInWeeks = calculateFlockAge(flock);
      
      // Get current week's program
      let currentProgram = programMap.get(ageInWeeks);
      
      if (!currentProgram) {
        // For flocks older than the program, use the last available program
        if (!lastProgram) {
          console.warn(`No feed program found at ${ageInWeeks} weeks`);
          return { flock, recommendation: null };
        }
        currentProgram = lastProgram;
      }

      // Get next week's program to check for transitions
      const nextProgram = programMap.get(ageInWeeks + 1);
      const isTransitionWeek = nextProgram && nextProgram.feedType !== currentProgram.feedType;
      const nextFeedType = isTransitionWeek ? nextProgram?.feedType : undefined;
      const nextTransitionWeek = isTransitionWeek ? ageInWeeks + 1 : undefined;

      const recommendation: FeedRecommendation = {
        feedType: currentProgram.feedType,
        gramPerHen: currentProgram.gramPerHen,
        totalAmountKg: (currentProgram.gramPerHen * flock.currentCount) / 1000, // Convert to kg
        ageInWeeks,
        ageInDays: currentProgram.ageInDays,
        isTransitionWeek: !!isTransitionWeek,
        nextFeedType,
        nextTransitionWeek,
      };

      return { flock, recommendation };
    });

    return recommendations.filter(item => item.recommendation !== null) as Array<{
      flock: Flock;
      recommendation: FeedRecommendation;
    }>;
  } catch (error) {
    console.error('Error getting all feed recommendations:', error);
    return [];
  }
}

/**
 * Get daily feed requirements for planning
 */
export async function getDailyFeedRequirements(): Promise<Array<{
  feedType: FeedType;
  totalAmountKg: number;
  flocksCount: number;
  gramPerHen: number;
  ageInWeeks: number;
  ageInDays: string;
  flocks: Array<{ 
    batchCode: string; 
    amountKg: number;
    flockId: string;
    currentCount: number;
    ageInWeeks: number;
    gramPerHen: number;
  }>;
}>> {
  try {
    const recommendations = await getAllFeedRecommendations();
    
    // Group by feed type
    const groupedByFeedType = recommendations.reduce((acc, { flock, recommendation }) => {
      const feedType = recommendation.feedType;
      if (!acc[feedType]) {
        acc[feedType] = {
          feedType,
          totalAmountKg: 0,
          flocksCount: 0,
          gramPerHen: recommendation.gramPerHen,
          ageInWeeks: recommendation.ageInWeeks,
          ageInDays: recommendation.ageInDays,
          flocks: []
        };
      }
      
      // Daily amount is weekly amount divided by 7
      const dailyAmount = recommendation.totalAmountKg / 7;
      acc[feedType].totalAmountKg += dailyAmount;
      acc[feedType].flocksCount += 1;
      acc[feedType].flocks.push({
        batchCode: flock.batchCode,
        amountKg: dailyAmount,
        flockId: flock.id,
        currentCount: flock.currentCount,
        ageInWeeks: recommendation.ageInWeeks,
        gramPerHen: recommendation.gramPerHen
      });
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groupedByFeedType);
  } catch (error) {
    console.error('Error getting daily feed requirements:', error);
    return [];
  }
}

/**
 * Get weekly feed requirements for planning
 */
export async function getWeeklyFeedRequirements(): Promise<Array<{
  feedType: FeedType;
  totalAmountKg: number;
  flocksCount: number;
  gramPerHen: number;
  ageInWeeks: number;
  ageInDays: string;
  flocks: Array<{ 
    batchCode: string; 
    amountKg: number;
    flockId: string;
    currentCount: number;
    ageInWeeks: number;
    gramPerHen: number;
  }>;
}>> {
  try {
    const recommendations = await getAllFeedRecommendations();
    
    // Group by feed type
    const groupedByFeedType = recommendations.reduce((acc, { flock, recommendation }) => {
      const feedType = recommendation.feedType;
      if (!acc[feedType]) {
        acc[feedType] = {
          feedType,
          totalAmountKg: 0,
          flocksCount: 0,
          gramPerHen: recommendation.gramPerHen,
          ageInWeeks: recommendation.ageInWeeks,
          ageInDays: recommendation.ageInDays,
          flocks: []
        };
      }
      
      acc[feedType].totalAmountKg += recommendation.totalAmountKg;
      acc[feedType].flocksCount += 1;
      acc[feedType].flocks.push({
        batchCode: flock.batchCode,
        amountKg: recommendation.totalAmountKg,
        flockId: flock.id,
        currentCount: flock.currentCount,
        ageInWeeks: recommendation.ageInWeeks,
        gramPerHen: recommendation.gramPerHen
      });
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groupedByFeedType);
  } catch (error) {
    console.error('Error getting weekly feed requirements:', error);
    return [];
  }
}

/**
 * Get feed program compliance for a flock
 */
export async function getFeedCompliance(flockId: string, days: number = 7): Promise<{
  compliance: number;
  recommendedTotal: number;
  actualTotal: number;
  variance: number;
  records: Array<{
    date: Date;
    recommended: number;
    actual: number;
    variance: number;
  }>;
}> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Execute queries in parallel to avoid N+1 problem
    const [flock, usageRecords, feedPrograms] = await Promise.all([
      prisma.flocks.findUnique({ where: { id: flockId } }),
      prisma.feedUsage.findMany({
        where: {
          flockId,
          date: {
            gte: startDate,
            lte: endDate,
          }
        },
        include: {
          feed: true
        },
        orderBy: { date: 'asc' }
      }),
      prisma.feedProgram.findMany({
        where: { isActive: true },
        orderBy: { ageInWeeks: 'asc' }
      })
    ]);

    if (!flock) throw new Error('Flock not found');

    // Create a map for O(1) lookup of feed programs by age
    const programMap = new Map<number, typeof feedPrograms[0]>();
    feedPrograms.forEach(program => {
      programMap.set(program.ageInWeeks, program);
    });

    // Get the last program for ages beyond the program
    const lastProgram = feedPrograms[feedPrograms.length - 1];

    // Calculate recommended amounts for each day
    const records = [];
    let recommendedTotal = 0;
    let actualTotal = 0;

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // Calculate age for this date
      const arrivalDate = new Date(flock.arrivalDate);
      const ageAtArrival = flock.ageInDays || 0;
      const daysSinceArrival = Math.floor((date.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalAgeInDays = ageAtArrival + daysSinceArrival;
      const ageInWeeks = Math.floor(totalAgeInDays / 7);

      // Get program for this age from the map
      let program = programMap.get(ageInWeeks);

      // If no program found for this age, use the last available program
      if (!program) {
        program = lastProgram;
      }

      const recommended = program ? (program.gramPerHen * flock.currentCount) / 1000 : 0;
      const actual = usageRecords.find(record => 
        record.date.toDateString() === date.toDateString()
      )?.amountUsed || 0;

      const variance = actual - recommended;
      
      records.push({
        date,
        recommended,
        actual,
        variance
      });

      recommendedTotal += recommended;
      actualTotal += actual;
    }

    const compliance = recommendedTotal > 0 ? Math.max(0, 100 - (Math.abs(actualTotal - recommendedTotal) / recommendedTotal) * 100) : 100;
    const variance = actualTotal - recommendedTotal;

    return {
      compliance,
      recommendedTotal,
      actualTotal,
      variance,
      records
    };
  } catch (error) {
    console.error('Error getting feed compliance:', error);
    return {
      compliance: 0,
      recommendedTotal: 0,
      actualTotal: 0,
      variance: 0,
      records: []
    };
  }
}

/**
 * Get feed type labels for display
 */
export const feedTypeLabels: Record<FeedType, string> = {
  LAYER_STARTER: 'Layer Starter',
  REARING: 'Rearing',
  PULLET_FEED: 'Pullet Feed',
  LAYER: 'Layer',
  LAYER_PHASE_1: 'Layer Phase 1',
  CUSTOM: 'Custom'
};

/**
 * Get feed type color for UI
 */
export const feedTypeColors: Record<FeedType, string> = {
  LAYER_STARTER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  REARING: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  PULLET_FEED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  LAYER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  LAYER_PHASE_1: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  CUSTOM: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
};
