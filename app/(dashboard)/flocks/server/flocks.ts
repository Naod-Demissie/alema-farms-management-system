"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, AuthenticatedUser } from "@/lib/auth-middleware";
import { ApiResponse, PaginatedResponse, FilterParams, PaginationParams, SortParams } from "@/lib/types";

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

// Get all flocks (simple version without pagination for use in dropdowns)
export async function getFlocksAction(): Promise<ApiResponse> {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    // Get all active flocks
    const flocks = await prisma.flocks.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        batchCode: true,
        arrivalDate: true,
        initialCount: true,
        currentCount: true,
        ageInDays: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      success: true,
      data: flocks
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

    // Get flocks with pagination - optimized with selective loading
    const flocksData = await prisma.flocks.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { [sort.field]: sort.direction },
      select: {
        id: true,
        batchCode: true,
        arrivalDate: true,
        initialCount: true,
        currentCount: true,
        ageInDays: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        mortality: {
          select: {
            count: true
          }
        },
        treatments: {
          select: {
            stillSickCount: true,
            endDate: true
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

    // Map the data to convert null to undefined for ageInDays
    const flocks = flocksData.map(flock => ({
      ...flock,
      ageInDays: flock.ageInDays ?? undefined,
      notes: flock.notes ?? undefined
    }));

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

// Get a single flock by ID with optimized selective loading
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

    // First get basic flock info
    const flock = await prisma.flocks.findUnique({
      where: { id: flockId },
      select: {
        id: true,
        batchCode: true,
        arrivalDate: true,
        initialCount: true,
        currentCount: true,
        ageInDays: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
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

    // Load related data in parallel only if needed
    const [recentVaccinations, recentTreatments, recentMortality, recentFeedUsage, recentEggProduction, recentBroilerProduction, recentManureProduction] = await Promise.all([
      prisma.vaccinations.findMany({
        where: { flockId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          vaccineName: true,
          administeredDate: true,
          notes: true,
          createdAt: true
        }
      }),
      prisma.treatments.findMany({
        where: { flockId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          disease: true,
          medication: true,
          startDate: true,
          response: true,
          notes: true,
          createdAt: true
        }
      }),
      prisma.mortality.findMany({
        where: { flockId },
        orderBy: { date: 'desc' },
        take: 5,
        select: {
          id: true,
          count: true,
          date: true,
          cause: true,
          causeDescription: true
        }
      }),
      prisma.feedUsage.findMany({
        where: { flockId },
        orderBy: { date: 'desc' },
        take: 5,
        select: {
          id: true,
          amountUsed: true,
          unit: true,
          date: true,
          notes: true,
          feed: {
            select: {
              id: true,
              feedType: true
            }
          }
        }
      }),
      prisma.eggProduction.findMany({
        where: { flockId },
        orderBy: { date: 'desc' },
        take: 5,
        select: {
          id: true,
          totalCount: true,
          date: true,
          notes: true
        }
      }),
      prisma.broilerProduction.findMany({
        where: { flockId },
        orderBy: { date: 'desc' },
        take: 5,
        select: {
          id: true,
          quantity: true,
          date: true,
          notes: true
        }
      }),
      prisma.manureProduction.findMany({
        where: { flockId },
        orderBy: { date: 'desc' },
        take: 5,
        select: {
          id: true,
          quantity: true,
          date: true,
          notes: true
        }
      })
    ]);

    return {
      success: true,
      data: {
        ...flock,
        vaccinations: recentVaccinations,
        treatments: recentTreatments,
        mortality: recentMortality,
        feedUsage: recentFeedUsage,
        eggProduction: recentEggProduction,
        broilerProduction: recentBroilerProduction,
        manureProduction: recentManureProduction
      }
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
      recentFlocks,
      mortalityRate
    ] = await Promise.all([
      // Total flocks
      prisma.flocks.count(),
      
      // Total birds across all flocks
      prisma.flocks.aggregate({
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
    const year = new Date().getFullYear().toString().slice(-2); // Last 2 digits of year
    
    // Find the highest existing batch code for this year
    const existingCodes = await prisma.flocks.findMany({
      where: {
        batchCode: {
          startsWith: `${prefix}${year}`
        }
      },
      select: { batchCode: true },
      orderBy: { batchCode: 'desc' }
    });

    let sequence = 1;
    if (existingCodes.length > 0) {
      // Extract the sequence number from the last batch code
      // Format: FL2501 -> extract "01" and convert to number
      const lastCode = existingCodes[0].batchCode;
      const sequencePart = lastCode.slice(-2); // Get last 2 digits
      const lastSequence = parseInt(sequencePart);
      sequence = lastSequence + 1;
    }

    // Generate batch code in format FL2501 (FL + year + 2-digit sequence)
    const batchCode = `${prefix}${year}${sequence.toString().padStart(2, '0')}`;

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
