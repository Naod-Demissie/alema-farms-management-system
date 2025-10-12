// Production management types and interfaces

export interface EggProduction {
  id: string;
  flockId: string;
  date: Date;
  totalCount: number;
  gradeCounts: {
    normal: number;
    cracked: number;
    spoiled: number;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  flock?: {
    id: string;
    batchCode: string;
    breed: string;
    currentCount: number;
  };
}

export interface CreateEggProductionData {
  flockId: string;
  date: Date;
  totalCount: number;
  gradeCounts: {
    normal: number;
    cracked: number;
    spoiled: number;
  };
  notes?: string;
}

export interface UpdateEggProductionData {
  totalCount?: number;
  gradeCounts?: {
    normal: number;
    cracked: number;
    spoiled: number;
  };
  notes?: string;
}

// Broiler Sales Interfaces
export interface BroilerSales {
  id: string;
  flockId: string;
  date: Date;
  quantity: number;
  unit: string;
  pricePerUnit?: number;
  totalAmount?: number;
  buyer?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  flock?: {
    id: string;
    batchCode: string;
    breed: string;
    currentCount: number;
  };
}

export interface CreateBroilerSalesData {
  flockId: string;
  date: Date;
  quantity: number;
  unit?: string;
  pricePerUnit?: number;
  totalAmount?: number;
  buyer?: string;
  notes?: string;
}

export interface UpdateBroilerSalesData {
  quantity?: number;
  unit?: string;
  pricePerUnit?: number;
  totalAmount?: number;
  buyer?: string;
  notes?: string;
}

// Manure Production Interfaces
export interface ManureProduction {
  id: string;
  flockId: string;
  date: Date;
  quantity: number;
  unit: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  flock?: {
    id: string;
    batchCode: string;
    breed: string;
    currentCount: number;
  };
}

export interface CreateManureProductionData {
  flockId: string;
  date: Date;
  quantity: number;
  unit?: string;
  notes?: string;
}

export interface ProductionFilters {
  search?: string;
  flockId?: string;
  productionType?: 'eggs' | 'broiler' | 'manure';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface EggProductionSummary {
  totalEggs: number;
  gradeBreakdown: {
    normal: number;
    cracked: number;
    spoiled: number;
  };
  averageDailyProduction: number;
  productionTrend: Array<{
    date: string;
    total: number;
    normal: number;
    cracked: number;
    spoiled: number;
  }>;
}

export interface BroilerSalesSummary {
  totalBirds: number;
  totalRevenue: number;
  averagePricePerBird: number;
  averageDailySales: number;
  salesTrend: Array<{
    date: string;
    birds: number;
    revenue: number;
  }>;
}

export interface ManureProductionSummary {
  totalWeight: number;
  averageDailyProduction: number;
  averageNutrientContent: {
    moisture: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
}

export interface DailyProductionData {
  date: string;
  flockId: string;
  flockCode: string;
  breed: string;
  totalEggs: number;
  normal: number;
  cracked: number;
  spoiled: number;
  qualityScore: number;
}

export interface ProductionFormData {
  flockId: string;
  date: string;
  totalCount: number;
  normalCount: number;
  crackedCount: number;
  spoiledCount: number;
  notes?: string;
}

export const EGG_GRADES = [
  { value: 'normal', label: 'Normal', color: 'bg-green-100 text-green-800' },
  { value: 'cracked', label: 'Cracked', color: 'bg-orange-100 text-orange-800' },
  { value: 'spoiled', label: 'Spoiled', color: 'bg-red-100 text-red-800' }
] as const;

export const BROILER_UNITS = [
  { value: 'birds', label: 'Birds' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'lbs', label: 'Pounds' }
] as const;


export const BREED_OPTIONS = [
  { value: 'layer', label: 'Layer' },
  { value: 'broiler', label: 'Broiler' },
  { value: 'dual_purpose', label: 'Dual Purpose' }
] as const;
