import { prisma } from "@/lib/prisma";
import { FeedType } from "@/lib/generated/prisma/enums";

// Feed Inventory Management
export async function getFeedInventory() {
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

export async function createFeedInventory(data: {
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
    return { success: true, data: feed };
  } catch (error) {
    console.error("Error creating feed inventory:", error);
    return { success: false, error: "Failed to create feed inventory item" };
  }
}

export async function updateFeedInventory(id: string, data: {
  feedType?: FeedType;
  supplierId?: string;
  quantity?: number;
  unit?: string;
  costPerUnit?: number;
  notes?: string;
  isActive?: boolean;
}) {
  try {
    const feed = await prisma.feedInventory.update({
      where: { id },
      data,
      include: {
        supplier: true,
      },
    });
    return { success: true, data: feed };
  } catch (error) {
    console.error("Error updating feed inventory:", error);
    return { success: false, error: "Failed to update feed inventory item" };
  }
}

export async function deleteFeedInventory(id: string) {
  try {
    await prisma.feedInventory.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting feed inventory:", error);
    return { success: false, error: "Failed to delete feed inventory item" };
  }
}

// Feed Usage Management
export async function getFeedUsage(filters?: {
  flockId?: string;
  feedId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const where: any = {};
    
    if (filters?.flockId) where.flockId = filters.flockId;
    if (filters?.feedId) where.feedId = filters.feedId;
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    const usage = await prisma.feedUsage.findMany({
      where,
      include: {
        flock: true,
        feed: {
          include: {
            supplier: true,
          },
        },
        recordedBy: true,
      },
      orderBy: {
        date: "desc",
      },
    });
    return { success: true, data: usage };
  } catch (error) {
    console.error("Error fetching feed usage:", error);
    return { success: false, error: "Failed to fetch feed usage records" };
  }
}

export async function createFeedUsage(data: {
  flockId: string;
  feedId: string;
  date: Date;
  amountUsed: number;
  unit: string;
  notes?: string;
  recordedById?: string;
}) {
  try {
    // Update feed inventory quantity
    await prisma.feedInventory.update({
      where: { id: data.feedId },
      data: {
        quantity: {
          decrement: data.amountUsed,
        },
      },
    });

    const usage = await prisma.feedUsage.create({
      data,
      include: {
        flock: true,
        feed: {
          include: {
            supplier: true,
          },
        },
        recordedBy: true,
      },
    });
    return { success: true, data: usage };
  } catch (error) {
    console.error("Error creating feed usage:", error);
    return { success: false, error: "Failed to create feed usage record" };
  }
}

export async function updateFeedUsage(id: string, data: {
  flockId?: string;
  feedId?: string;
  date?: Date;
  amountUsed?: number;
  unit?: string;
  notes?: string;
}) {
  try {
    const usage = await prisma.feedUsage.update({
      where: { id },
      data,
      include: {
        flock: true,
        feed: {
          include: {
            supplier: true,
          },
        },
        recordedBy: true,
      },
    });
    return { success: true, data: usage };
  } catch (error) {
    console.error("Error updating feed usage:", error);
    return { success: false, error: "Failed to update feed usage record" };
  }
}

export async function deleteFeedUsage(id: string) {
  try {
    await prisma.feedUsage.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting feed usage:", error);
    return { success: false, error: "Failed to delete feed usage record" };
  }
}

// Feed Suppliers Management
export async function getFeedSuppliers() {
  try {
    const suppliers = await prisma.feedSupplier.findMany({
      include: {
        feedInventory: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return { success: true, data: suppliers };
  } catch (error) {
    console.error("Error fetching feed suppliers:", error);
    return { success: false, error: "Failed to fetch feed suppliers" };
  }
}

export async function createFeedSupplier(data: {
  name: string;
  contactName?: string;
  phone?: string;
  address?: string;
  notes?: string;
}) {
  try {
    const supplier = await prisma.feedSupplier.create({
      data: {
        ...data,
        isActive: true,
      },
    });
    return { success: true, data: supplier };
  } catch (error) {
    console.error("Error creating feed supplier:", error);
    return { success: false, error: "Failed to create feed supplier" };
  }
}

export async function updateFeedSupplier(id: string, data: {
  name?: string;
  contactName?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}) {
  try {
    const supplier = await prisma.feedSupplier.update({
      where: { id },
      data,
    });
    return { success: true, data: supplier };
  } catch (error) {
    console.error("Error updating feed supplier:", error);
    return { success: false, error: "Failed to update feed supplier" };
  }
}

export async function deleteFeedSupplier(id: string) {
  try {
    await prisma.feedSupplier.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting feed supplier:", error);
    return { success: false, error: "Failed to delete feed supplier" };
  }
}

// Analytics and Reporting
export async function getFeedAnalytics(filters?: {
  startDate?: Date;
  endDate?: Date;
  flockId?: string;
}) {
  try {
    const where: any = {};
    
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }
    if (filters?.flockId) where.flockId = filters.flockId;

    const usage = await prisma.feedUsage.findMany({
      where,
      include: {
        flock: true,
        feed: true,
      },
    });

    const totalUsage = usage.reduce((sum, record) => sum + record.amountUsed, 0);

    // Group by feed type
    const feedTypeBreakdown = await prisma.feedUsage.groupBy({
      by: ['feedId'],
      where,
      _sum: {
        amountUsed: true,
      },
      _count: {
        id: true,
      },
    });

    // Get feed type details
    const feedTypeDetails = await Promise.all(
      feedTypeBreakdown.map(async (group) => {
        const feed = await prisma.feedInventory.findUnique({
          where: { id: group.feedId },
        });
        return {
          feedType: feed?.feedType,
          totalUsage: group._sum.amountUsed || 0,
          count: group._count.id,
        };
      })
    );

    // Group by flock
    const flockBreakdown = await prisma.feedUsage.groupBy({
      by: ['flockId'],
      where,
      _sum: {
        amountUsed: true,
      },
      _count: {
        id: true,
      },
    });

    // Get flock details
    const flockDetails = await Promise.all(
      flockBreakdown.map(async (group) => {
        const flock = await prisma.flocks.findUnique({
          where: { id: group.flockId },
        });
        return {
          flockId: group.flockId,
          batchCode: flock?.batchCode,
          breed: flock?.breed,
          totalUsage: group._sum.amountUsed || 0,
          count: group._count.id,
        };
      })
    );

    return {
      success: true,
      data: {
        totalUsage,
        feedTypeBreakdown: feedTypeDetails,
        flockBreakdown: flockDetails,
        totalRecords: usage.length,
      },
    };
  } catch (error) {
    console.error("Error fetching feed analytics:", error);
    return { success: false, error: "Failed to fetch feed analytics" };
  }
}

// Low Stock Alerts (removed - no longer using minStock)
export async function getLowStockAlerts() {
  try {
    // Return empty array since we no longer track minStock
    return { success: true, data: [] };
  } catch (error) {
    console.error("Error fetching low stock alerts:", error);
    return { success: false, error: "Failed to fetch low stock alerts" };
  }
}
