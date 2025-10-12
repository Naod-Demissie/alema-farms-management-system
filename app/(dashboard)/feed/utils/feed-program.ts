// lib/feed-program.ts
// Client-safe types and constants for feed program
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
