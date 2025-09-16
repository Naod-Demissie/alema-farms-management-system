"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { logAction } from "./audit";
import { ApiResponse, PaginatedResponse, FilterParams, PaginationParams, SortParams } from "./types";

// ===================
// Production Management Types
// ===================

export interface ProductionFilters extends FilterParams {
  flockId?: string;
  grade?: 'A' | 'B' | 'C' | 'cracked' | 'discard';
  fertility?: 'fertile' | 'infertile';
  dateRange?: {
    start: Date;
    end: Date;
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
  qualityScore: number; // Calculated based on grade distribution
}

// ===================
// Egg Production Management
// ===================

export async function createEggProduction(data: CreateEggProductionData): Promise<ApiResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;

    // Validate flock exists
    const flock = await prisma.flocks.findUnique({
      where: { id: data.flockId }
    });

    if (!flock) {
      return {
        success: false,
        message: "Flock not found"
      };
    }

    // Check if production record already exists for this date and flock
    const existingRecord = await prisma.eggProduction.findFirst({
      where: {
        flockId: data.flockId,
        date: {
          gte: new Date(data.date.getFullYear(), data.date.getMonth(), data.date.getDate()),
          lt: new Date(data.date.getFullYear(), data.date.getMonth(), data.date.getDate() + 1)
        }
      }
    });

    if (existingRecord) {
      return {
        success: false,
        message: "Production record already exists for this date and flock"
      };
    }

    // Validate quantity
    if (data.quantity < 0) {
      return {
        success: false,
        message: "Quantity cannot be negative"
      };
    }

    // Create egg production record
    const eggProduction = await prisma.eggProduction.create({
      data: {
        flockId: data.flockId,
        date: data.date,
        quantity: data.quantity,
        grade: data.grade,
        fertility: data.fertility
      },
      include: {
        flock: {
          select: {
            batchCode: true,
            breed: true
          }
        }
      }
    });

    // Log the action
    await logAction({
      action: 'CREATE_EGG_PRODUCTION',
      staffId: currentUser.id,
      details: {
        flockId: data.flockId,
        quantity: data.quantity,
        grade: data.grade,
        fertility: data.fertility
      }
    });

    return {
      success: true,
      data: eggProduction,
      message: "Egg production record created successfully"
    };

  } catch (error) {
    console.error("Error creating egg production:", error);
    return {
      success: false,
      message: "Failed to create egg production record",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function getEggProduction(
  filters: ProductionFilters = {},
  pagination: PaginationParams = {},
  sort: SortParams = { field: 'date', direction: 'desc' }
): Promise<PaginatedResponse<any>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.flockId) {
      where.flockId = filters.flockId;
    }

    if (filters.grade) {
      where.grade = filters.grade;
    }

    if (filters.fertility) {
      where.fertility = filters.fertility;
    }

    if (filters.dateRange) {
      where.date = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      };
    }

    if (filters.search) {
      where.OR = [
        {
          flock: {
            batchCode: {
              contains: filters.search,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    // Get total count
    const total = await prisma.eggProduction.count({ where });

    // Get egg production records
    const eggProduction = await prisma.eggProduction.findMany({
      where,
      include: {
        flock: {
          select: {
            id: true,
            batchCode: true,
            breed: true,
            currentCount: true
          }
        }
      },
      orderBy: {
        [sort.field]: sort.direction
      },
      skip: offset,
      take: limit
    });

    return {
      success: true,
      data: eggProduction,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

  } catch (error) {
    console.error("Error fetching egg production:", error);
    return {
      success: false,
      message: "Failed to fetch egg production records",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function getEggProductionById(productionId: string): Promise<ApiResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const eggProduction = await prisma.eggProduction.findUnique({
      where: { id: productionId },
      include: {
        flock: {
          select: {
            id: true,
            batchCode: true,
            breed: true,
            currentCount: true,
            arrivalDate: true
          }
        }
      }
    });

    if (!eggProduction) {
      return {
        success: false,
        message: "Egg production record not found"
      };
    }

    return {
      success: true,
      data: eggProduction
    };

  } catch (error) {
    console.error("Error fetching egg production by ID:", error);
    return {
      success: false,
      message: "Failed to fetch egg production record",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function updateEggProduction(
  productionId: string,
  data: UpdateEggProductionData
): Promise<ApiResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;

    // Check if production record exists
    const existingRecord = await prisma.eggProduction.findUnique({
      where: { id: productionId }
    });

    if (!existingRecord) {
      return {
        success: false,
        message: "Egg production record not found"
      };
    }

    // Validate quantity if provided
    if (data.quantity !== undefined && data.quantity < 0) {
      return {
        success: false,
        message: "Quantity cannot be negative"
      };
    }

    // Update egg production record
    const updatedProduction = await prisma.eggProduction.update({
      where: { id: productionId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        flock: {
          select: {
            batchCode: true,
            breed: true
          }
        }
      }
    });

    // Log the action
    await logAction({
      action: 'UPDATE_EGG_PRODUCTION',
      staffId: currentUser.id,
      details: {
        productionId,
        changes: data
      }
    });

    return {
      success: true,
      data: updatedProduction,
      message: "Egg production record updated successfully"
    };

  } catch (error) {
    console.error("Error updating egg production:", error);
    return {
      success: false,
      message: "Failed to update egg production record",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function deleteEggProduction(productionId: string): Promise<ApiResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;

    // Check if production record exists
    const existingRecord = await prisma.eggProduction.findUnique({
      where: { id: productionId }
    });

    if (!existingRecord) {
      return {
        success: false,
        message: "Egg production record not found"
      };
    }

    // Delete egg production record
    await prisma.eggProduction.delete({
      where: { id: productionId }
    });

    // Log the action
    await logAction({
      action: 'DELETE_EGG_PRODUCTION',
      staffId: currentUser.id,
      details: {
        productionId,
        flockId: existingRecord.flockId,
        quantity: existingRecord.quantity,
        grade: existingRecord.grade
      }
    });

    return {
      success: true,
      message: "Egg production record deleted successfully"
    };

  } catch (error) {
    console.error("Error deleting egg production:", error);
    return {
      success: false,
      message: "Failed to delete egg production record",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// ===================
// Production Analytics & Reporting
// ===================

export async function getProductionSummary(
  flockId?: string,
  dateRange?: { start: Date; end: Date }
): Promise<ApiResponse<EggProductionSummary>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const where: any = {};
    
    if (flockId) {
      where.flockId = flockId;
    }

    if (dateRange) {
      where.date = {
        gte: dateRange.start,
        lte: dateRange.end
      };
    }

    // Get all production records
    const productionRecords = await prisma.eggProduction.findMany({
      where,
      include: {
        flock: {
          select: {
            batchCode: true,
            breed: true
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    // Calculate summary statistics
    const totalEggs = productionRecords.reduce((sum, record) => sum + record.quantity, 0);

    const gradeBreakdown = {
      A: 0,
      B: 0,
      C: 0,
      cracked: 0,
      discard: 0
    };

    const fertilityBreakdown = {
      fertile: 0,
      infertile: 0
    };

    productionRecords.forEach(record => {
      if (record.grade) {
        gradeBreakdown[record.grade]++;
      }
      if (record.fertility) {
        fertilityBreakdown[record.fertility]++;
      }
    });

    // Calculate average daily production
    const uniqueDates = new Set(productionRecords.map(record => 
      record.date.toISOString().split('T')[0]
    )).size;
    
    const averageDailyProduction = uniqueDates > 0 ? totalEggs / uniqueDates : 0;

    // Generate production trend data
    const trendMap = new Map<string, {
      total: number;
      gradeA: number;
      gradeB: number;
      gradeC: number;
      cracked: number;
      discard: number;
    }>();

    productionRecords.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, {
          total: 0,
          gradeA: 0,
          gradeB: 0,
          gradeC: 0,
          cracked: 0,
          discard: 0
        });
      }

      const dayData = trendMap.get(dateKey)!;
      dayData.total += record.quantity;
      
      if (record.grade) {
        dayData[record.grade]++;
      }
    });

    const productionTrend = Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      ...data
    }));

    const summary: EggProductionSummary = {
      totalEggs,
      gradeBreakdown,
      fertilityBreakdown,
      averageDailyProduction: Math.round(averageDailyProduction * 100) / 100,
      productionTrend
    };

    return {
      success: true,
      data: summary
    };

  } catch (error) {
    console.error("Error fetching production summary:", error);
    return {
      success: false,
      message: "Failed to fetch production summary",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function getDailyProductionData(
  dateRange?: { start: Date; end: Date }
): Promise<ApiResponse<DailyProductionData[]>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const where: any = {};
    
    if (dateRange) {
      where.date = {
        gte: dateRange.start,
        lte: dateRange.end
      };
    }

    // Get production records grouped by date and flock
    const productionRecords = await prisma.eggProduction.findMany({
      where,
      include: {
        flock: {
          select: {
            id: true,
            batchCode: true,
            breed: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { flock: { batchCode: 'asc' } }
      ]
    });

    // Group by date and flock
    const groupedData = new Map<string, Map<string, any>>();

    productionRecords.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      const flockKey = record.flockId;

      if (!groupedData.has(dateKey)) {
        groupedData.set(dateKey, new Map());
      }

      const dateData = groupedData.get(dateKey)!;
      if (!dateData.has(flockKey)) {
        dateData.set(flockKey, {
          date: dateKey,
          flockId: record.flockId,
          flockCode: record.flock.batchCode,
          breed: record.flock.breed,
          totalEggs: 0,
          gradeA: 0,
          gradeB: 0,
          gradeC: 0,
          cracked: 0,
          discard: 0,
          fertile: 0,
          infertile: 0
        });
      }

      const flockData = dateData.get(flockKey)!;
      flockData.totalEggs += record.quantity;

      if (record.grade) {
        flockData[record.grade]++;
      }

      if (record.fertility) {
        flockData[record.fertility]++;
      }
    });

    // Convert to array and calculate quality scores
    const dailyData: DailyProductionData[] = [];

    groupedData.forEach(dateData => {
      dateData.forEach(flockData => {
        // Calculate quality score based on grade distribution
        const total = flockData.totalEggs;
        const gradeA = flockData.gradeA;
        const gradeB = flockData.gradeB;
        const gradeC = flockData.gradeC;
        const cracked = flockData.cracked;
        const discard = flockData.discard;

        // Quality score: A=100, B=80, C=60, cracked=20, discard=0
        const qualityScore = total > 0 ? 
          Math.round(((gradeA * 100 + gradeB * 80 + gradeC * 60 + cracked * 20 + discard * 0) / total) * 100) / 100 : 0;

        dailyData.push({
          ...flockData,
          qualityScore
        });
      });
    });

    return {
      success: true,
      data: dailyData
    };

  } catch (error) {
    console.error("Error fetching daily production data:", error);
    return {
      success: false,
      message: "Failed to fetch daily production data",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// ===================
// Bulk Operations
// ===================

export async function createBulkEggProduction(
  records: CreateEggProductionData[]
): Promise<ApiResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return {
        success: false,
        message: "Authentication required"
      };
    }

    const currentUser = session.user as any;

    // Validate all records
    for (const record of records) {
      if (record.quantity < 0) {
        return {
          success: false,
          message: `Invalid quantity for flock ${record.flockId}: ${record.quantity}`
        };
      }

      // Check if flock exists
      const flock = await prisma.flocks.findUnique({
        where: { id: record.flockId }
      });

      if (!flock) {
        return {
          success: false,
          message: `Flock not found: ${record.flockId}`
        };
      }
    }

    // Create all records in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdRecords = [];

      for (const record of records) {
        // Check for existing record
        const existingRecord = await tx.eggProduction.findFirst({
          where: {
            flockId: record.flockId,
            date: {
              gte: new Date(record.date.getFullYear(), record.date.getMonth(), record.date.getDate()),
              lt: new Date(record.date.getFullYear(), record.date.getMonth(), record.date.getDate() + 1)
            }
          }
        });

        if (existingRecord) {
          throw new Error(`Production record already exists for flock ${record.flockId} on ${record.date.toISOString().split('T')[0]}`);
        }

        const created = await tx.eggProduction.create({
          data: {
            flockId: record.flockId,
            date: record.date,
            quantity: record.quantity,
            grade: record.grade,
            fertility: record.fertility
          }
        });

        createdRecords.push(created);
      }

      return createdRecords;
    });

    // Log the action
    await logAction({
      action: 'CREATE_BULK_EGG_PRODUCTION',
      staffId: currentUser.id,
      details: {
        recordCount: records.length,
        flockIds: records.map(r => r.flockId)
      }
    });

    return {
      success: true,
      data: result,
      message: `Successfully created ${result.length} egg production records`
    };

  } catch (error) {
    console.error("Error creating bulk egg production:", error);
    return {
      success: false,
      message: "Failed to create bulk egg production records",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
