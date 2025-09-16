// Flock management types and interfaces

export interface Flock {
  id: string;
  batchCode: string;
  breed: 'broiler' | 'layer' | 'dual_purpose';
  source: 'hatchery' | 'farm' | 'imported';
  arrivalDate: Date;
  initialCount: number;
  currentCount: number;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    vaccinations: number;
    treatments: number;
    healthMonitoring: number;
    mortality: number;
    feedUsage: number;
    eggProduction: number;
    expenses: number;
    revenue: number;
  };
}

export interface FlockFormData {
  batchCode: string;
  breed: 'broiler' | 'layer' | 'dual_purpose';
  source: 'hatchery' | 'farm' | 'imported';
  arrivalDate: Date;
  initialCount: number;
  currentCount: number;
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
  flocksByBreed: Array<{
    breed: string;
    count: number;
    birds: number;
  }>;
  flocksBySource: Array<{
    source: string;
    count: number;
    birds: number;
  }>;
  recentFlocks: number;
  averageMortalityRate: number;
}

export interface FlockFilters {
  search?: string;
  breed?: 'broiler' | 'layer' | 'dual_purpose';
  source?: 'hatchery' | 'farm' | 'imported';
  batchCode?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export const BREED_OPTIONS = [
  { value: 'broiler', label: 'Broiler', description: 'Meat production' },
  { value: 'layer', label: 'Layer', description: 'Egg production' },
  { value: 'dual_purpose', label: 'Dual Purpose', description: 'Both meat and eggs' }
] as const;

export const SOURCE_OPTIONS = [
  { value: 'hatchery', label: 'Hatchery', description: 'Commercial hatchery' },
  { value: 'farm', label: 'Farm', description: 'Own farm breeding' },
  { value: 'imported', label: 'Imported', description: 'Imported from other sources' }
] as const;

export const POPULATION_UPDATE_REASONS = [
  'Mortality',
  'Culling',
  'Sale',
  'Transfer',
  'Addition',
  'Other'
] as const;
