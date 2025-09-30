"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { FeedType } from "@/lib/generated/prisma";

export async function getFeedInventoryAction() {
  try {
    console.log("[Feed Inventory] getFeedInventoryAction called");
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
    // Convert quantity to kg if unit is quintal
    const quantityInKg = data.unit === 'QUINTAL' ? data.quantity * 100 : data.quantity;
    
    // Calculate total cost based on kg quantity
    const totalCost = data.costPerUnit ? quantityInKg * data.costPerUnit : null;
    
    const feed = await prisma.feedInventory.create({
      data: {
        feedType: data.feedType,
        supplierId: data.supplierId && data.supplierId !== "none" ? data.supplierId : null,
        quantity: quantityInKg,
        unit: data.unit as any,
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
    
    // Calculate total cost if quantity or costPerUnit changed
    let quantity = data.quantity ?? currentRecord.quantity;
    const costPerUnit = data.costPerUnit ?? currentRecord.costPerUnit;
    
    // Convert quantity to kg if unit is quintal
    if (data.unit === 'QUINTAL' && data.quantity) {
      quantity = data.quantity * 100;
    }
    
    const totalCost = costPerUnit ? quantity * costPerUnit : null;
    
    const feed = await prisma.feedInventory.update({
      where: { id },
      data: {
        ...data,
        totalCost,
        supplierId: data.supplierId !== undefined 
          ? (data.supplierId && data.supplierId !== "none" ? data.supplierId : null)
          : undefined,
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
    const inventory = await prisma.feedInventory.findMany({
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
    });

    // Calculate additional metrics for each inventory item
    const inventoryWithMetrics = await Promise.all(
      inventory.map(async (item) => {
        // Get total usage in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentUsage = await prisma.feedUsage.aggregate({
          where: {
            feedId: item.id,
            date: {
              gte: thirtyDaysAgo,
            },
          },
          _sum: {
            amountUsed: true,
          },
        });

        const totalUsage30Days = recentUsage._sum.amountUsed || 0;
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
      })
    );

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

    const projections = await Promise.all(
      inventory.map(async (item) => {
        // Get usage data for the last 30 days to calculate average
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentUsage = await prisma.feedUsage.findMany({
          where: {
            feedId: item.id,
            date: {
              gte: thirtyDaysAgo,
            },
          },
          orderBy: {
            date: 'asc',
          },
        });

        // Calculate average daily usage
        const totalUsage = recentUsage.reduce((sum, usage) => sum + usage.amountUsed, 0);
        const averageDailyUsage = totalUsage / 30;

        // Generate daily projections
        const projections = [];
        let currentStock = item.quantity;
        const today = new Date();

        for (let i = 0; i < days; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          
          currentStock -= averageDailyUsage;
          
          projections.push({
            date,
            projectedStock: Math.max(0, currentStock),
            dailyUsage: averageDailyUsage,
            isLowStock: false,
            isOutOfStock: currentStock <= 0,
          });
        }

        // Find when stock will run out
        const outOfStockDate = projections.find(p => p.isOutOfStock)?.date || null;
        const lowStockDate = projections.find(p => p.isLowStock && !p.isOutOfStock)?.date || null;

        return {
          ...item,
          averageDailyUsage,
          projections,
          outOfStockDate,
          lowStockDate,
          daysUntilOutOfStock: outOfStockDate ? 
            Math.ceil((outOfStockDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null,
          daysUntilLowStock: lowStockDate ? 
            Math.ceil((lowStockDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null,
        };
      })
    );

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
