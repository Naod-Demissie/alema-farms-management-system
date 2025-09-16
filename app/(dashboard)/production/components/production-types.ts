// Production management types and interfaces

export interface EggProduction {
  id: string;
  flockId: string;
  date: Date;
  quantity: number;
  grade: 'A' | 'B' | 'C' | 'cracked' | 'discard';
  fertility?: 'fertile' | 'infertile';
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
  quantity: number;
  grade: 'A' | 'B' | 'C' | 'cracked' | 'discard';
  fertility?: 'fertile' | 'infertile';
  notes?: string;
}

export interface UpdateEggProductionData {
  quantity?: number;
  grade?: 'A' | 'B' | 'C' | 'cracked' | 'discard';
  fertility?: 'fertile' | 'infertile';
  notes?: string;
}

export interface ProductionFilters {
  search?: string;
  flockId?: string;
  grade?: 'A' | 'B' | 'C' | 'cracked' | 'discard';
  fertility?: 'fertile' | 'infertile';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface EggProductionSummary {
  totalEggs: number;
  gradeBreakdown: {
    A: number;
    B: number;
    C: number;
    cracked: number;
    discard: number;
  };
  fertilityBreakdown: {
    fertile: number;
    infertile: number;
  };
  averageDailyProduction: number;
  productionTrend: Array<{
    date: string;
    total: number;
    gradeA: number;
    gradeB: number;
    gradeC: number;
    cracked: number;
    discard: number;
  }>;
}

export interface DailyProductionData {
  date: string;
  flockId: string;
  flockCode: string;
  breed: string;
  totalEggs: number;
  gradeA: number;
  gradeB: number;
  gradeC: number;
  cracked: number;
  discard: number;
  fertile: number;
  infertile: number;
  qualityScore: number;
}

export interface ProductionFormData {
  flockId: string;
  date: string;
  quantity: number;
  grade: 'A' | 'B' | 'C' | 'cracked' | 'discard';
  fertility?: 'fertile' | 'infertile';
  notes?: string;
}

export const EGG_GRADES = [
  { value: 'A', label: 'Grade A', color: 'bg-green-100 text-green-800' },
  { value: 'B', label: 'Grade B', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'C', label: 'Grade C', color: 'bg-orange-100 text-orange-800' },
  { value: 'cracked', label: 'Cracked', color: 'bg-red-100 text-red-800' },
  { value: 'discard', label: 'Discard', color: 'bg-gray-100 text-gray-800' }
] as const;

export const FERTILITY_OPTIONS = [
  { value: 'fertile', label: 'Fertile', color: 'bg-green-100 text-green-800' },
  { value: 'infertile', label: 'Infertile', color: 'bg-red-100 text-red-800' }
] as const;

export const BREED_OPTIONS = [
  { value: 'layer', label: 'Layer' },
  { value: 'broiler', label: 'Broiler' },
  { value: 'dual_purpose', label: 'Dual Purpose' }
] as const;
