"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, AuthenticatedUser } from "./auth-middleware";
import { ApiResponse, PaginatedResponse, FilterParams, PaginationParams, SortParams } from "./types";
import { addToInventory, deductFromInventory } from "./inventory-service";
import { InventoryType } from "@/lib/generated/prisma/enums";

// ===================
// Production Management Types
// ===================

export interface ProductionFilters extends FilterParams {
  flockId?: string;
  productionType?: 'eggs' | 'broiler' | 'manure';
  dateRange?: {
    start: Date;
    end: Date;
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

// Broiler Production Interfaces
export interface CreateBroilerProductionData {
  flockId: string;
  date: Date;
  quantity: number;
  notes?: string;
}

export interface UpdateBroilerProductionData {
  quantity?: number;
  notes?: string;
}

// Manure Production Interfaces
export interface CreateManureProductionData {
  flockId: string;
  date: Date;
  quantity: number;
  notes?: string;
}

export interface UpdateManureProductionData {
  quantity?: number;
  notes?: string;
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

export interface BroilerProductionSummary {
  totalBirds: number;
  averageDailyProduction: number;
  productionTrend: Array<{
    date: string;
    birds: number;
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
  totalEggs: number;
  normal: number;
  cracked: number;
  spoiled: number;
  qualityScore: number; // Calculated based on grade distribution
}

// ===================
// Egg Production Management
// ===================

export async function createEggProduction(data: CreateEggProductionData): Promise<ApiResponse> {
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

    // Validate totalCount
    if (data.totalCount < 0) {
      return {
        success: false,
        message: "Total count cannot be negative"
      };
    }

    // Validate grade counts
    const { normal, cracked, spoiled } = data.gradeCounts;
    if (normal < 0 || cracked < 0 || spoiled < 0) {
      return {
        success: false,
        message: "Grade counts cannot be negative"
      };
    }

    // Validate that grade counts sum to total count
    if (normal + cracked + spoiled !== data.totalCount) {
      return {
        success: false,
        message: "Grade counts must sum to total count"
      };
    }

    // Create egg production record
    const eggProduction = await prisma.eggProduction.create({
      data: {
        flockId: data.flockId,
        date: data.date,
        totalCount: data.totalCount,
        gradeCounts: data.gradeCounts,
        notes: data.notes
      },
      include: {
        flock: {
          select: {
            batchCode: true
          }
        }
      }
    });

    // Add eggs to inventory when produced
    const inventoryResult = await addToInventory(InventoryType.EGG, data.totalCount);
    if (!inventoryResult.success) {
      console.warn("Failed to update egg inventory:", inventoryResult.error);
      // Don't fail the production creation if inventory update fails
    }

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
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.flockId) {
      where.flockId = filters.flockId;
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
            batchCode: true
,
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
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const eggProduction = await prisma.eggProduction.findUnique({
      where: { id: productionId },
      include: {
        flock: {
          select: {
            id: true,
            batchCode: true,
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
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }
    const user = authResult.user!;

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

    // Validate totalCount if provided
    if (data.totalCount !== undefined && data.totalCount < 0) {
      return {
        success: false,
        message: "Total count cannot be negative"
      };
    }

    // Validate grade counts if provided
    if (data.gradeCounts) {
      const { normal, cracked, spoiled } = data.gradeCounts;
      if (normal < 0 || cracked < 0 || spoiled < 0) {
        return {
          success: false,
          message: "Grade counts cannot be negative"
        };
      }

      // If totalCount is also being updated, validate they match
      const totalFromCounts = normal + cracked + spoiled;
      if (data.totalCount !== undefined && totalFromCounts !== data.totalCount) {
        return {
          success: false,
          message: "Grade counts must sum to total count"
        };
      }
    }

    // Calculate inventory difference
    const oldTotalCount = existingRecord.totalCount;
    const newTotalCount = data.totalCount !== undefined ? data.totalCount : oldTotalCount;
    const inventoryDifference = newTotalCount - oldTotalCount;

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
            batchCode: true
          }
        }
      }
    });

    // Update inventory based on the difference
    if (inventoryDifference !== 0) {
      if (inventoryDifference > 0) {
        // Add the difference to inventory
        const inventoryResult = await addToInventory(InventoryType.EGG, inventoryDifference);
        if (!inventoryResult.success) {
          console.warn("Failed to update egg inventory:", inventoryResult.error);
        }
      } else {
        // Deduct the difference from inventory
        const inventoryResult = await deductFromInventory(InventoryType.EGG, Math.abs(inventoryDifference));
        if (!inventoryResult.success) {
          console.warn("Failed to update egg inventory:", inventoryResult.error);
        }
      }
    }

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
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }
    const user = authResult.user!;

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

    // Deduct eggs from inventory when deleting production record
    const inventoryResult = await deductFromInventory(InventoryType.EGG, existingRecord.totalCount);
    if (!inventoryResult.success) {
      console.warn("Failed to update egg inventory:", inventoryResult.error);
      // Don't fail the deletion if inventory update fails
    }

    // Delete egg production record
    await prisma.eggProduction.delete({
      where: { id: productionId }
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
// Broiler Sales Management
// ===================

export async function createBroilerProduction(data: CreateBroilerProductionData): Promise<ApiResponse> {
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

    // Validate quantity
    if (data.quantity < 0) {
      return {
        success: false,
        message: "Quantity cannot be negative"
      };
    }

    // Create broiler production record
    const broilerProduction = await prisma.broilerProduction.create({
      data: {
        flockId: data.flockId,
        date: data.date,
        quantity: data.quantity,
        notes: data.notes
      },
      include: {
        flock: {
          select: {
            batchCode: true
          }
        }
      }
    });

    // Add broilers to inventory when produced
    const inventoryResult = await addToInventory(InventoryType.BROILER, data.quantity);
    if (!inventoryResult.success) {
      console.warn("Failed to update broiler inventory:", inventoryResult.error);
      // Don't fail the production creation if inventory update fails
    }

    return {
      success: true,
      data: broilerProduction,
      message: "Broiler production record created successfully"
    };

  } catch (error) {
    console.error("Error creating broiler production:", error);
    return {
      success: false,
      message: "Failed to create broiler production record",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function getBroilerProduction(
  filters: ProductionFilters = {},
  pagination: PaginationParams = {},
  sort: SortParams = { field: 'date', direction: 'desc' }
): Promise<PaginatedResponse<any>> {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.flockId) {
      where.flockId = filters.flockId;
    }

    // Note: meatQuality filter not implemented in current schema

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
    const total = await prisma.broilerProduction.count({ where });

    // Get broiler production records
    const broilerProduction = await prisma.broilerProduction.findMany({
      where,
      include: {
        flock: {
          select: {
            id: true,
            batchCode: true
,
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
      data: broilerProduction,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

  } catch (error) {
    console.error("Error fetching broiler production:", error);
    return {
      success: false,
      message: "Failed to fetch broiler production records",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function updateBroilerProduction(
  productionId: string,
  data: UpdateBroilerProductionData
): Promise<ApiResponse> {
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

    // Check if production record exists
    const existingRecord = await prisma.broilerProduction.findUnique({
      where: { id: productionId }
    });

    if (!existingRecord) {
      return {
        success: false,
        message: "Broiler production record not found"
      };
    }

    // Validate quantity if provided
    if (data.quantity !== undefined && data.quantity < 0) {
      return {
        success: false,
        message: "Quantity cannot be negative"
      };
    }

    // Calculate inventory difference
    const oldQuantity = existingRecord.quantity;
    const newQuantity = data.quantity !== undefined ? data.quantity : oldQuantity;
    const inventoryDifference = newQuantity - oldQuantity;

    // Update broiler production record
    const updatedProduction = await prisma.broilerProduction.update({
      where: { id: productionId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        flock: {
          select: {
            batchCode: true
          }
        }
      }
    });

    // Update inventory based on the difference
    if (inventoryDifference !== 0) {
      if (inventoryDifference > 0) {
        // Add the difference to inventory
        const inventoryResult = await addToInventory(InventoryType.BROILER, inventoryDifference);
        if (!inventoryResult.success) {
          console.warn("Failed to update broiler inventory:", inventoryResult.error);
        }
      } else {
        // Deduct the difference from inventory
        const inventoryResult = await deductFromInventory(InventoryType.BROILER, Math.abs(inventoryDifference));
        if (!inventoryResult.success) {
          console.warn("Failed to update broiler inventory:", inventoryResult.error);
        }
      }
    }

    return {
      success: true,
      data: updatedProduction,
      message: "Broiler production record updated successfully"
    };

  } catch (error) {
    console.error("Error updating broiler production:", error);
    return {
      success: false,
      message: "Failed to update broiler production record",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function deleteBroilerProduction(productionId: string): Promise<ApiResponse> {
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

    // Check if production record exists
    const existingRecord = await prisma.broilerProduction.findUnique({
      where: { id: productionId }
    });

    if (!existingRecord) {
      return {
        success: false,
        message: "Broiler production record not found"
      };
    }

    // Deduct broilers from inventory when deleting production record
    const inventoryResult = await deductFromInventory(InventoryType.BROILER, existingRecord.quantity);
    if (!inventoryResult.success) {
      console.warn("Failed to update broiler inventory:", inventoryResult.error);
      // Don't fail the deletion if inventory update fails
    }

    // Delete broiler production record
    await prisma.broilerProduction.delete({
      where: { id: productionId }
    });

    return {
      success: true,
      message: "Broiler production record deleted successfully"
    };

  } catch (error) {
    console.error("Error deleting broiler production:", error);
    return {
      success: false,
      message: "Failed to delete broiler production record",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// ===================
// Manure Production Management
// ===================

export async function createManureProduction(data: CreateManureProductionData): Promise<ApiResponse> {
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

    // Validate quantity
    if (data.quantity < 0) {
      return {
        success: false,
        message: "Quantity cannot be negative"
      };
    }

    // Create manure production record
    const manureProduction = await prisma.manureProduction.create({
      data: {
        flockId: data.flockId,
        date: data.date,
        quantity: data.quantity,
        notes: data.notes
      },
      include: {
        flock: {
          select: {
            batchCode: true
          }
        }
      }
    });

    // Add manure to inventory when produced
    const inventoryResult = await addToInventory(InventoryType.MANURE, data.quantity);
    if (!inventoryResult.success) {
      console.warn("Failed to update manure inventory:", inventoryResult.error);
      // Don't fail the production creation if inventory update fails
    }

    return {
      success: true,
      data: manureProduction,
      message: "Manure production record created successfully"
    };

  } catch (error) {
    console.error("Error creating manure production:", error);
    return {
      success: false,
      message: "Failed to create manure production record",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function getManureProduction(
  filters: ProductionFilters = {},
  pagination: PaginationParams = {},
  sort: SortParams = { field: 'date', direction: 'desc' }
): Promise<PaginatedResponse<any>> {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.flockId) {
      where.flockId = filters.flockId;
    }

    // Note: manureQuality filter not implemented in current schema

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
    const total = await prisma.manureProduction.count({ where });

    // Get manure production records
    const manureProduction = await prisma.manureProduction.findMany({
      where,
      include: {
        flock: {
          select: {
            id: true,
            batchCode: true
,
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
      data: manureProduction,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

  } catch (error) {
    console.error("Error fetching manure production:", error);
    return {
      success: false,
      message: "Failed to fetch manure production records",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function updateManureProduction(
  productionId: string,
  data: UpdateManureProductionData
): Promise<ApiResponse> {
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

    // Check if production record exists
    const existingRecord = await prisma.manureProduction.findUnique({
      where: { id: productionId }
    });

    if (!existingRecord) {
      return {
        success: false,
        message: "Manure production record not found"
      };
    }

    // Validate quantity if provided
    if (data.quantity !== undefined && data.quantity < 0) {
      return {
        success: false,
        message: "Quantity cannot be negative"
      };
    }

    // Calculate inventory difference
    const oldQuantity = existingRecord.quantity;
    const newQuantity = data.quantity !== undefined ? data.quantity : oldQuantity;
    const inventoryDifference = newQuantity - oldQuantity;

    // Update manure production record
    const updatedProduction = await prisma.manureProduction.update({
      where: { id: productionId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        flock: {
          select: {
            batchCode: true
          }
        }
      }
    });

    // Update inventory based on the difference
    if (inventoryDifference !== 0) {
      if (inventoryDifference > 0) {
        // Add the difference to inventory
        const inventoryResult = await addToInventory(InventoryType.MANURE, inventoryDifference);
        if (!inventoryResult.success) {
          console.warn("Failed to update manure inventory:", inventoryResult.error);
        }
      } else {
        // Deduct the difference from inventory
        const inventoryResult = await deductFromInventory(InventoryType.MANURE, Math.abs(inventoryDifference));
        if (!inventoryResult.success) {
          console.warn("Failed to update manure inventory:", inventoryResult.error);
        }
      }
    }

    return {
      success: true,
      data: updatedProduction,
      message: "Manure production record updated successfully"
    };

  } catch (error) {
    console.error("Error updating manure production:", error);
    return {
      success: false,
      message: "Failed to update manure production record",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function deleteManureProduction(productionId: string): Promise<ApiResponse> {
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

    // Check if production record exists
    const existingRecord = await prisma.manureProduction.findUnique({
      where: { id: productionId }
    });

    if (!existingRecord) {
      return {
        success: false,
        message: "Manure production record not found"
      };
    }

    // Deduct manure from inventory when deleting production record
    const inventoryResult = await deductFromInventory(InventoryType.MANURE, existingRecord.quantity);
    if (!inventoryResult.success) {
      console.warn("Failed to update manure inventory:", inventoryResult.error);
      // Don't fail the deletion if inventory update fails
    }

    // Delete manure production record
    await prisma.manureProduction.delete({
      where: { id: productionId }
    });

    return {
      success: true,
      message: "Manure production record deleted successfully"
    };

  } catch (error) {
    console.error("Error deleting manure production:", error);
    return {
      success: false,
      message: "Failed to delete manure production record",
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
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
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
            batchCode: true
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    // Calculate summary statistics
    const totalEggs = productionRecords.reduce((sum, record) => sum + record.totalCount, 0);

    const gradeBreakdown = {
      normal: 0,
      cracked: 0,
      spoiled: 0
    };

    productionRecords.forEach(record => {
      const counts = record.gradeCounts as { normal: number; cracked: number; spoiled: number };
      if (counts) {
        gradeBreakdown.normal += counts.normal || 0;
        gradeBreakdown.cracked += counts.cracked || 0;
        gradeBreakdown.spoiled += counts.spoiled || 0;
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
      normal: number;
      cracked: number;
      spoiled: number;
    }>();

    productionRecords.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, {
          total: 0,
          normal: 0,
          cracked: 0,
          spoiled: 0
        });
      }

      const dayData = trendMap.get(dateKey)!;
      dayData.total += record.totalCount;
      
      const counts = record.gradeCounts as { normal: number; cracked: number; spoiled: number };
      if (counts) {
        dayData.normal += counts.normal || 0;
        dayData.cracked += counts.cracked || 0;
        dayData.spoiled += counts.spoiled || 0;
      }
    });

    const productionTrend = Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      ...data
    }));

    const summary: EggProductionSummary = {
      totalEggs,
      gradeBreakdown,
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
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
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
            batchCode: true
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
          totalEggs: 0,
          normal: 0,
          cracked: 0,
          spoiled: 0
        });
      }

      const flockData = dateData.get(flockKey)!;
      flockData.totalEggs += record.totalCount;

      const counts = record.gradeCounts as { normal: number; cracked: number; spoiled: number };
      if (counts) {
        flockData.normal += counts.normal || 0;
        flockData.cracked += counts.cracked || 0;
        flockData.spoiled += counts.spoiled || 0;
      }

    });

    // Convert to array and calculate quality scores
    const dailyData: DailyProductionData[] = [];

    groupedData.forEach(dateData => {
      dateData.forEach(flockData => {
        // Calculate quality score based on grade distribution
        const total = flockData.totalEggs;
        const normal = flockData.normal;
        const cracked = flockData.cracked;
        const spoiled = flockData.spoiled;

        // Quality score: NORMAL=100, CRACKED=60, SPOILED=0
        const qualityScore = total > 0 ? 
          Math.round(((normal * 100 + cracked * 60 + spoiled * 0) / total) * 100) / 100 : 0;

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
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }
    const user = authResult.user!;

    // Validate all records
    for (const record of records) {
      if (record.totalCount < 0) {
        return {
          success: false,
          message: `Invalid total count for flock ${record.flockId}: ${record.totalCount}`
        };
      }
    }

    // Get all unique flock IDs and validate them in a single query
    const flockIds = [...new Set(records.map(record => record.flockId))];
    const existingFlocks = await prisma.flocks.findMany({
      where: { id: { in: flockIds } },
      select: { id: true }
    });

    const existingFlockIds = new Set(existingFlocks.map(flock => flock.id));
    
    // Check if all flocks exist
    for (const flockId of flockIds) {
      if (!existingFlockIds.has(flockId)) {
        return {
          success: false,
          message: `Flock not found: ${flockId}`
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
            totalCount: record.totalCount,
            gradeCounts: record.gradeCounts,
            notes: record.notes
          }
        });

        createdRecords.push(created);
      }

      return createdRecords;
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
