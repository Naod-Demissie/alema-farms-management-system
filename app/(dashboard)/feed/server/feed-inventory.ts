"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { FeedType } from "@/lib/generated/prisma/enums";

export async function getFeedInventoryAction() {
  try {
    const inventory = await prisma.feedInventory.findMany({
      include: {
        supplier: true,
        feedUsage: {
          include: {
            flock: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return { success: true, data: inventory };
  } catch (error) {
    console.error("Error fetching feed inventory:", error);
    return { success: false, error: "Failed to fetch feed inventory" };
  }
}

export async function createFeedInventoryAction(data: {
  feedType: FeedType;
  supplierId?: string;
  quantity: number;
  unit: string;
  costPerUnit?: number;
  notes?: string;
}) {
  try {
    // IMPORTANT: Convert quantity to KG for storage in feed_inventory table
    // This ensures feed usage validation works correctly (it assumes all quantities are in kg)
    // 1 quintal = 100 kg
    const quantityInKg = data.unit === 'QUINTAL' ? data.quantity * 100 : data.quantity;
    
    // Calculate total cost: quantity * costPerUnit
    // costPerUnit is per the selected unit (KG or Quintal)
    const totalCost = data.costPerUnit ? data.quantity * data.costPerUnit : null;
    
    const feed = await prisma.feedInventory.create({
      data: {
        feedType: data.feedType,
        supplierId: data.supplierId && data.supplierId !== "none" ? data.supplierId : null,
        quantity: quantityInKg, // Always store in KG
        unit: data.unit as any, // Keep original unit for display purposes
        costPerUnit: data.costPerUnit,
        totalCost,
        notes: data.notes,
        isActive: true,
      },
      include: {
        supplier: true,
      },
    });
    revalidatePath("/feed");
    return { success: true, data: feed };
  } catch (error) {
    console.error("Error creating feed inventory:", error);
    return { success: false, error: "Failed to create feed inventory" };
  }
}

export async function updateFeedInventoryAction(id: string, data: {
  feedType?: FeedType;
  supplierId?: string;
  quantity?: number;
  unit?: string;
  costPerUnit?: number;
  notes?: string;
  isActive?: boolean;
}) {
  try {
    // Get current record to calculate total cost
    const currentRecord = await prisma.feedInventory.findUnique({ where: { id } });
    if (!currentRecord) {
      return { success: false, error: "Feed inventory not found" };
    }
    
    // IMPORTANT: Convert quantity to KG for storage if unit is QUINTAL
    // Only convert if quantity is being updated
    const unit = data.unit ?? currentRecord.unit;
    let quantityInKg = data.quantity;
    
    if (data.quantity !== undefined && unit === 'QUINTAL') {
      quantityInKg = data.quantity * 100; // Convert quintal to kg
    }
    
    // Calculate total cost: quantity * costPerUnit
    // costPerUnit is per the selected unit (KG or Quintal)
    // Use the original input quantity (not converted) for cost calculation
    const quantity = data.quantity ?? currentRecord.quantity;
    const costPerUnit = data.costPerUnit ?? currentRecord.costPerUnit;
    const totalCost = costPerUnit ? quantity * costPerUnit : null;
    
    const feed = await prisma.feedInventory.update({
      where: { id },
      data: {
        feedType: data.feedType,
        quantity: quantityInKg, // Always store in KG
        unit: data.unit as any,  // Keep original unit for display
        costPerUnit: data.costPerUnit,
        notes: data.notes,
        isActive: data.isActive,
        totalCost,
        ...(data.supplierId !== undefined && {
          supplier: data.supplierId && data.supplierId !== "none" 
            ? { connect: { id: data.supplierId } }
            : { disconnect: true }
        }),
      },
      include: {
        supplier: true,
      },
    });
    revalidatePath("/feed");
    return { success: true, data: feed };
  } catch (error) {
    console.error("Error updating feed inventory:", error);
    return { success: false, error: "Failed to update feed inventory" };
  }
}

export async function deleteFeedInventoryAction(id: string) {
  try {
    await prisma.feedInventory.delete({
      where: { id },
    });
    revalidatePath("/feed");
    return { success: true };
  } catch (error) {
    console.error("Error deleting feed inventory:", error);
    return { success: false, error: "Failed to delete feed inventory" };
  }
}

// Enhanced inventory tracking functions
export async function getInventoryWithUsageAction() {
  try {
    // Calculate 30 days ago once
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Execute all queries in parallel to avoid N+1 problem
    const [inventory, usageAggregates] = await Promise.all([
      // Get inventory with recent usage records
      prisma.feedInventory.findMany({
        include: {
          supplier: true,
          feedUsage: {
            include: {
              flock: true,
            },
            orderBy: {
              date: 'desc'
            },
            take: 10 // Last 10 usage records
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      // Get usage aggregates for all feeds in a single query
      prisma.feedUsage.groupBy({
        by: ['feedId'],
        where: {
          date: {
            gte: thirtyDaysAgo,
          },
        },
        _sum: {
          amountUsed: true,
        },
      })
    ]);

    // Create a map for O(1) lookup of usage data
    const usageMap = new Map(
      usageAggregates.map(usage => [usage.feedId, usage._sum.amountUsed || 0])
    );

    // Process inventory data without additional database queries
    const inventoryWithMetrics = inventory.map(item => {
      const totalUsage30Days = usageMap.get(item.id) || 0;
      const averageDailyUsage = totalUsage30Days / 30;

      // Calculate days remaining at current usage rate
      const daysRemaining = averageDailyUsage > 0 ? item.quantity / averageDailyUsage : null;

      // Get low stock status (removed minStock logic)
      const isLowStock = false;
      const isCriticalStock = false;

      return {
        ...item,
        totalUsage30Days,
        averageDailyUsage,
        daysRemaining,
        isLowStock,
        isCriticalStock,
      };
    });

    return { success: true, data: inventoryWithMetrics };
  } catch (error) {
    console.error("Error fetching inventory with usage:", error);
    return { success: false, error: "Failed to fetch inventory with usage data" };
  }
}

export async function getInventoryProjectionAction(feedType?: string, days: number = 30) {
  try {
    const whereClause = feedType ? { feedType: feedType as any } : {};
    
    const inventory = await prisma.feedInventory.findMany({
      where: {
        ...whereClause,
        isActive: true,
      },
      include: {
        supplier: true,
      },
    });

    // Calculate 30 days ago once
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all usage data for all feeds in a single query to avoid N+1 problem
    const allUsageData = await prisma.feedUsage.findMany({
      where: {
        date: {
          gte: thirtyDaysAgo,
        },
        feed: {
          ...whereClause,
          isActive: true,
        }
      },
      orderBy: {
        date: 'asc',
      },
      select: {
        feedId: true,
        amountUsed: true,
        date: true,
      }
    });

    // Group usage data by feedId for O(1) lookup
    const usageByFeedId = new Map<string, typeof allUsageData>();
    allUsageData.forEach(usage => {
      if (!usageByFeedId.has(usage.feedId)) {
        usageByFeedId.set(usage.feedId, []);
      }
      usageByFeedId.get(usage.feedId)!.push(usage);
    });

    // Process projections without additional database queries
    const projections = inventory.map(item => {
      const recentUsage = usageByFeedId.get(item.id) || [];
      
      // Calculate average daily usage
      const totalUsage = recentUsage.reduce((sum, usage) => sum + usage.amountUsed, 0);
      const averageDailyUsage = totalUsage / 30;

      // Generate daily projections
      const dailyProjections = [];
      let currentStock = item.quantity;
      const today = new Date();

      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        currentStock -= averageDailyUsage;
        
        dailyProjections.push({
          date,
          projectedStock: Math.max(0, currentStock),
          dailyUsage: averageDailyUsage,
          isLowStock: false,
          isOutOfStock: currentStock <= 0,
        });
      }

      // Find when stock will run out
      const outOfStockDate = dailyProjections.find(p => p.isOutOfStock)?.date || null;
      const lowStockDate = dailyProjections.find(p => p.isLowStock && !p.isOutOfStock)?.date || null;

      return {
        ...item,
        averageDailyUsage,
        projections: dailyProjections,
        outOfStockDate,
        lowStockDate,
        daysUntilOutOfStock: outOfStockDate ? 
          Math.ceil((outOfStockDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null,
        daysUntilLowStock: lowStockDate ? 
          Math.ceil((lowStockDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null,
      };
    });

    return { success: true, data: projections };
  } catch (error) {
    console.error("Error fetching inventory projection:", error);
    return { success: false, error: "Failed to fetch inventory projection" };
  }
}

export async function getFeedConsumptionAnalyticsAction(filters?: {
  startDate?: Date;
  endDate?: Date;
  feedType?: string;
  flockId?: string;
}) {
  try {
    const whereClause: any = {};
    
    if (filters?.startDate || filters?.endDate) {
      whereClause.date = {};
      if (filters.startDate) whereClause.date.gte = filters.startDate;
      if (filters.endDate) whereClause.date.lte = filters.endDate;
    }
    if (filters?.flockId) whereClause.flockId = filters.flockId;

    // Get usage records
    const usageRecords = await prisma.feedUsage.findMany({
      where: whereClause,
      include: {
        flock: true,
        feed: {
          include: {
            supplier: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Group by feed type
    const feedTypeAnalytics = usageRecords.reduce((acc, record) => {
      const feedType = record.feed.feedType;
      if (!acc[feedType]) {
        acc[feedType] = {
          feedType,
          totalUsage: 0,
          recordCount: 0,
          flocks: new Set(),
          dailyUsage: {},
        };
      }
      
      acc[feedType].totalUsage += record.amountUsed;
      acc[feedType].recordCount += 1;
      acc[feedType].flocks.add(record.flockId);
      
      const dateKey = record.date.toISOString().split('T')[0];
      if (!acc[feedType].dailyUsage[dateKey]) {
        acc[feedType].dailyUsage[dateKey] = 0;
      }
      acc[feedType].dailyUsage[dateKey] += record.amountUsed;
      
      return acc;
    }, {} as any);

    // Convert sets to arrays and calculate averages
    const analytics = Object.values(feedTypeAnalytics).map((item: any) => ({
      ...item,
      flocks: Array.from(item.flocks),
      averageDailyUsage: Object.values(item.dailyUsage).reduce((sum: number, usage: any) => sum + usage, 0) / Object.keys(item.dailyUsage).length || 0,
    }));

    // Calculate overall statistics
    const totalUsage = usageRecords.reduce((sum, record) => sum + record.amountUsed, 0);
    const uniqueFlocks = new Set(usageRecords.map(record => record.flockId)).size;

    return {
      success: true,
      data: {
        analytics,
        summary: {
          totalUsage,
          totalRecords: usageRecords.length,
          uniqueFlocks,
          dateRange: {
            start: filters?.startDate || (usageRecords.length > 0 ? usageRecords[0].date : null),
            end: filters?.endDate || (usageRecords.length > 0 ? usageRecords[usageRecords.length - 1].date : null),
          },
        },
      },
    };
  } catch (error) {
    console.error("Error fetching feed consumption analytics:", error);
    return { success: false, error: "Failed to fetch feed consumption analytics" };
  }
}
