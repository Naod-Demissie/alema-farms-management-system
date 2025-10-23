// Flock management types and interfaces

export interface Flock {
  id: string;
  batchCode: string;
  arrivalDate: Date;
  initialCount: number;
  currentCount: number;
  ageInDays?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  mortality?: Array<{
    count: number;
  }>;
  treatments?: Array<{
    stillSickCount: number | null;
    endDate: Date | null;
  }>;
  _count?: {
    vaccinations: number;
    treatments: number;
    mortality: number;
    feedUsage: number;
    eggProduction: number;
    broilerProduction: number;
    manureProduction: number;
    notifications: number;
  };
}

export interface FlockFormData {
  batchCode: string;
  arrivalDate: Date;
  initialCount: number;
  currentCount: number;
  ageInDays: number;
  notes?: string;
}

export interface FlockPopulationUpdate {
  flockId: string;
  newCount: number;
  reason: string;
  notes?: string;
}

export interface FlockStatistics {
  totalFlocks: number;
  totalBirds: number;
  recentFlocks: number;
  averageMortalityRate: number;
}

export interface FlockFilters {
  search?: string;
  batchCode?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}


export const POPULATION_UPDATE_REASONS = [
  'Mortality',
  'Culling',
  'Sale',
  'Transfer',
  'Addition',
  'Other'
] as const;
