"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, AuthenticatedUser } from "./auth-middleware";
import { ApiResponse, PaginatedResponse, FilterParams, PaginationParams, SortParams } from "./types";

// ===================
// Flock Management Types
// ===================

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
  _count?: {
    vaccinations: number;
    treatments: number;
    mortality: number;
    feedUsage: number;
    eggProduction: number;
    expenses: number;
    revenue: number;
  };
}

export interface FlockFilters extends FilterParams {
  batchCode?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface CreateFlockData {
  batchCode: string;
  arrivalDate: Date;
  initialCount: number;
  currentCount: number;
  ageInDays?: number;
  notes?: string;
}

export interface UpdateFlockData {
  batchCode?: string;
  arrivalDate?: Date;
  initialCount?: number;
  currentCount?: number;
  ageInDays?: number;
  notes?: string;
}

export interface FlockPopulationUpdate {
  flockId: string;
  newCount: number;
  reason: string;
  notes?: string;
}

// ===================
// Flock CRUD Operations
// ===================

// Create a new flock
export async function createFlock(data: CreateFlockData): Promise<ApiResponse> {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }
    const user = authResult.user!;

    // Check if batch code already exists
    const existingFlock = await prisma.flocks.findUnique({
      where: { batchCode: data.batchCode }
    });

    if (existingFlock) {
      return {
        success: false,
        message: "A flock with this batch code already exists"
      };
    }

    // Validate counts
    if (data.initialCount <= 0) {
      return {
        success: false,
        message: "Initial count must be greater than 0"
      };
    }

    if (data.currentCount > data.initialCount) {
      return {
        success: false,
        message: "Current count cannot exceed initial count"
      };
    }

    const flock = await prisma.flocks.create({
      data: {
        batchCode: data.batchCode,
        arrivalDate: data.arrivalDate,
        initialCount: data.initialCount,
        currentCount: data.currentCount,
        ageInDays: data.ageInDays,
        notes: data.notes,
      }
    });


    return {
      success: true,
      data: flock,
      message: "Flock created successfully"
    };
  } catch (error) {
    const e = error as Error;
    console.error('Error creating flock:', e);
    return {
      success: false,
      message: e.message || "Failed to create flock"
    };
  }
}

// Get all flocks with filtering and pagination
export async function getFlocks(
  filters: FlockFilters = {},
  pagination: PaginationParams = {},
  sort: SortParams = { field: 'createdAt', direction: 'desc' }
): Promise<PaginatedResponse<Flock>> {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { batchCode: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.batchCode) {
      where.batchCode = { contains: filters.batchCode, mode: 'insensitive' };
    }

    if (filters.dateRange) {
      where.arrivalDate = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      };
    }

    // Get total count
    const total = await prisma.flocks.count({ where });

    // Get flocks with pagination
    const flocks = await prisma.flocks.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { [sort.field]: sort.direction },
      include: {
        mortality: {
          select: {
            count: true
          }
        },
        _count: {
          select: {
            vaccinations: true,
            treatments: true,
            mortality: true,
            feedUsage: true,
            eggProduction: true,
            broilerProduction: true,
            manureProduction: true,
            notifications: true
          }
        }
      }
    });

    return {
      success: true,
      data: flocks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    const e = error as Error;
    console.error('Error fetching flocks:', e);
    return {
      success: false,
      message: e.message || "Failed to fetch flocks"
    };
  }
}

// Get a single flock by ID
export async function getFlockById(flockId: string): Promise<ApiResponse> {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const flock = await prisma.flocks.findUnique({
      where: { id: flockId },
      include: {
        vaccinations: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        treatments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        mortality: {
          orderBy: { date: 'desc' },
          take: 5
        },
        feedUsage: {
          orderBy: { date: 'desc' },
          take: 5,
          include: {
            feed: true
          }
        },
        eggProduction: {
          orderBy: { date: 'desc' },
          take: 5
        },
        broilerProduction: {
          orderBy: { date: 'desc' },
          take: 5
        },
        manureProduction: {
          orderBy: { date: 'desc' },
          take: 5
        },
        _count: {
          select: {
            vaccinations: true,
            treatments: true,
            mortality: true,
            feedUsage: true,
            eggProduction: true,
            broilerProduction: true,
            manureProduction: true,
            notifications: true
          }
        }
      }
    });

    if (!flock) {
      return {
        success: false,
        message: "Flock not found"
      };
    }

    return {
      success: true,
      data: flock
    };
  } catch (error) {
    const e = error as Error;
    console.error('Error fetching flock:', e);
    return {
      success: false,
      message: e.message || "Failed to fetch flock"
    };
  }
}

// Update a flock
export async function updateFlock(flockId: string, data: UpdateFlockData): Promise<ApiResponse> {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }
    const user = authResult.user!;

    // Check if flock exists
    const existingFlock = await prisma.flocks.findUnique({
      where: { id: flockId }
    });

    if (!existingFlock) {
      return {
        success: false,
        message: "Flock not found"
      };
    }

    // Check if batch code is being changed and if it already exists
    if (data.batchCode && data.batchCode !== existingFlock.batchCode) {
      const batchCodeExists = await prisma.flocks.findUnique({
        where: { batchCode: data.batchCode }
      });

      if (batchCodeExists) {
        return {
          success: false,
          message: "A flock with this batch code already exists"
        };
      }
    }

    // Validate counts if being updated
    if (data.initialCount !== undefined && data.initialCount <= 0) {
      return {
        success: false,
        message: "Initial count must be greater than 0"
      };
    }

    if (data.currentCount !== undefined) {
      const finalInitialCount = data.initialCount || existingFlock.initialCount;
      if (data.currentCount > finalInitialCount) {
        return {
          success: false,
          message: "Current count cannot exceed initial count"
        };
      }
    }

    const updatedFlock = await prisma.flocks.update({
      where: { id: flockId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });


    return {
      success: true,
      data: updatedFlock,
      message: "Flock updated successfully"
    };
  } catch (error) {
    const e = error as Error;
    console.error('Error updating flock:', e);
    return {
      success: false,
      message: e.message || "Failed to update flock"
    };
  }
}

// Delete a flock
export async function deleteFlock(flockId: string): Promise<ApiResponse> {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }
    const user = authResult.user!;

    // Check if flock exists
    const existingFlock = await prisma.flocks.findUnique({
      where: { id: flockId }
    });

    if (!existingFlock) {
      return {
        success: false,
        message: "Flock not found"
      };
    }

    // Check if flock has related records
    const relatedRecords = await prisma.flocks.findUnique({
      where: { id: flockId },
      include: {
        _count: {
          select: {
            vaccinations: true,
            treatments: true,
            mortality: true,
            feedUsage: true,
            eggProduction: true,
            broilerProduction: true,
            manureProduction: true,
            notifications: true
          }
        }
      }
    });

    const totalRelatedRecords = Object.values(relatedRecords?._count || {}).reduce((sum, count) => sum + count, 0);

    if (totalRelatedRecords > 0) {
      return {
        success: false,
        message: `Cannot delete flock. It has ${totalRelatedRecords} related records. Please delete related records first.`
      };
    }

    await prisma.flocks.delete({
      where: { id: flockId }
    });


    return {
      success: true,
      message: "Flock deleted successfully"
    };
  } catch (error) {
    const e = error as Error;
    console.error('Error deleting flock:', e);
    return {
      success: false,
      message: e.message || "Failed to delete flock"
    };
  }
}

// ===================
// Population Management
// ===================

// Update flock population
export async function updateFlockPopulation(data: FlockPopulationUpdate): Promise<ApiResponse> {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }
    const user = authResult.user!;

    const flock = await prisma.flocks.findUnique({
      where: { id: data.flockId }
    });

    if (!flock) {
      return {
        success: false,
        message: "Flock not found"
      };
    }

    if (data.newCount < 0) {
      return {
        success: false,
        message: "Population count cannot be negative"
      };
    }

    if (data.newCount > flock.initialCount) {
      return {
        success: false,
        message: "Current count cannot exceed initial count"
      };
    }

    const updatedFlock = await prisma.flocks.update({
      where: { id: data.flockId },
      data: {
        currentCount: data.newCount,
        updatedAt: new Date()
      }
    });


    return {
      success: true,
      data: updatedFlock,
      message: "Flock population updated successfully"
    };
  } catch (error) {
    const e = error as Error;
    console.error('Error updating flock population:', e);
    return {
      success: false,
      message: e.message || "Failed to update flock population"
    };
  }
}

// ===================
// Analytics and Reporting
// ===================

// Get flock statistics
export async function getFlockStatistics(): Promise<ApiResponse> {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const [
      totalFlocks,
      totalBirds,
      flocksByBreed,
      flocksBySource,
      recentFlocks,
      mortalityRate
    ] = await Promise.all([
      // Total flocks
      prisma.flocks.count(),
      
      // Total birds across all flocks
      prisma.flocks.aggregate({
        _sum: { currentCount: true }
      }),
      
      // Flocks by breed
      prisma.flocks.groupBy({
        by: ['breed'],
        _count: { breed: true },
        _sum: { currentCount: true }
      }),
      
      // Flocks by source
      prisma.flocks.groupBy({
        by: ['source'],
        _count: { source: true },
        _sum: { currentCount: true }
      }),
      
      // Recent flocks (last 30 days)
      prisma.flocks.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Calculate average mortality rate
      prisma.flocks.aggregate({
        _avg: {
          currentCount: true,
          initialCount: true
        }
      })
    ]);

    const avgMortalityRate = mortalityRate._avg.initialCount && mortalityRate._avg.currentCount
      ? ((mortalityRate._avg.initialCount - mortalityRate._avg.currentCount) / mortalityRate._avg.initialCount) * 100
      : 0;

    const statistics = {
      totalFlocks,
      totalBirds: totalBirds._sum.currentCount || 0,
      flocksByBreed: flocksByBreed.map(item => ({
        breed: item.breed,
        count: item._count.breed,
        birds: item._sum.currentCount || 0
      })),
      flocksBySource: flocksBySource.map(item => ({
        source: item.source,
        count: item._count.source,
        birds: item._sum.currentCount || 0
      })),
      recentFlocks,
      averageMortalityRate: Math.round(avgMortalityRate * 100) / 100
    };

    return {
      success: true,
      data: statistics
    };
  } catch (error) {
    const e = error as Error;
    console.error('Error fetching flock statistics:', e);
    return {
      success: false,
      message: e.message || "Failed to fetch flock statistics"
    };
  }
}

// Generate unique batch code
export async function generateBatchCode(breed: string): Promise<ApiResponse> {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const prefix = 'FL'; // Generic flock prefix
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    // Find the highest existing batch code for this month
    const existingCodes = await prisma.flocks.findMany({
      where: {
        batchCode: {
          startsWith: `${prefix}${year}${month}`
        }
      },
      select: { batchCode: true },
      orderBy: { batchCode: 'desc' }
    });

    let sequence = 1;
    if (existingCodes.length > 0) {
      const lastCode = existingCodes[0].batchCode;
      const lastSequence = parseInt(lastCode.slice(-3));
      sequence = lastSequence + 1;
    }

    const batchCode = `${prefix}${year}${month}${sequence.toString().padStart(3, '0')}`;

    return {
      success: true,
      data: { batchCode }
    };
  } catch (error) {
    const e = error as Error;
    console.error('Error generating batch code:', e);
    return {
      success: false,
      message: e.message || "Failed to generate batch code"
    };
  }
}
