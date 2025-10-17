"use server";

import { prisma } from "@/lib/prisma";
import { InventoryType } from "@/lib/generated/prisma/enums";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Add to inventory (for production/income)
export async function addToInventory(
  type: InventoryType,
  amount: number,
  details?: any
): Promise<ApiResponse<any>> {
  try {
    // Find existing inventory item of this type
    let inventory = await prisma.inventory.findFirst({
      where: {
        type,
        isActive: true,
      },
    });

    if (!inventory) {
      // Create new inventory item if it doesn't exist
      inventory = await prisma.inventory.create({
        data: {
          type,
          name: `${type.toLowerCase()} inventory`,
          quantity: amount,
          unit: type === 'EGG' ? 'pieces' : 'kg',
          ...(type === 'EGG' && { eggCount: amount }),
          ...(type === 'BROILER' && { broilerCount: amount }),
          ...(type === 'MANURE' && { manureWeight: amount }),
          ...(type === 'FEED' && { feedDetails: details }),
          ...(type === 'MEDICINE' && { medicineDetails: details }),
          ...(type === 'OTHER' && { otherDetails: details }),
        },
      });
    } else {
      // Update existing inventory
      const updateData: any = {
        quantity: inventory.quantity + amount,
      };

      if (type === 'EGG') {
        updateData.eggCount = (inventory.eggCount || 0) + amount;
      } else if (type === 'BROILER') {
        updateData.broilerCount = (inventory.broilerCount || 0) + amount;
      } else if (type === 'MANURE') {
        updateData.manureWeight = (inventory.manureWeight || 0) + amount;
      } else if (type === 'FEED' && details) {
        // NEW: Aggregate feed types properly
        const currentFeedDetails = inventory.feedDetails as any || {};
        const newFeedDetails = { ...currentFeedDetails };
        Object.keys(details).forEach(feedType => {
          newFeedDetails[feedType] = (newFeedDetails[feedType] || 0) + details[feedType];
        });
        updateData.feedDetails = newFeedDetails;
      }

      inventory = await prisma.inventory.update({
        where: { id: inventory.id },
        data: updateData,
      });
    }

    return {
      success: true,
      data: inventory,
    };
  } catch (error) {
    console.error("Error adding to inventory:", error);
    return {
      success: false,
      error: "Failed to add to inventory",
    };
  }
}

// Deduct from inventory (for usage/sales)
export async function deductFromInventory(
  type: InventoryType,
  amount: number,
  details?: any
): Promise<ApiResponse<any>> {
  try {
    const inventory = await prisma.inventory.findFirst({
      where: {
        type,
        isActive: true,
      },
    });

    if (!inventory) {
      return {
        success: false,
        error: `No ${type.toLowerCase()} inventory found`,
      };
    }

    // For FEED type, check specific feed type availability
    if (type === 'FEED' && details) {
      const feedDetails = inventory.feedDetails as any || {};
      const feedType = Object.keys(details)[0]; // Get the first (and should be only) feed type
      const availableQuantity = feedDetails[feedType] || 0;
      const requiredQuantity = details[feedType];
      
      if (availableQuantity < requiredQuantity) {
        return {
          success: false,
          error: `Insufficient ${feedType} inventory. Available: ${availableQuantity}, Required: ${requiredQuantity}`,
        };
      }
    } else if (inventory.quantity < amount) {
      return {
        success: false,
        error: `Insufficient ${type.toLowerCase()} inventory. Available: ${inventory.quantity}, Required: ${amount}`,
      };
    }

    const updateData: any = {
      quantity: inventory.quantity - amount,
    };

    if (type === 'EGG') {
      updateData.eggCount = Math.max(0, (inventory.eggCount || 0) - amount);
    } else if (type === 'BROILER') {
      updateData.broilerCount = Math.max(0, (inventory.broilerCount || 0) - amount);
    } else if (type === 'MANURE') {
      updateData.manureWeight = Math.max(0, (inventory.manureWeight || 0) - amount);
    } else if (type === 'FEED' && details) {
      // NEW: Handle feed type deduction properly
      const currentFeedDetails = inventory.feedDetails as any || {};
      const newFeedDetails = { ...currentFeedDetails };
      Object.keys(details).forEach(feedType => {
        newFeedDetails[feedType] = Math.max(0, (newFeedDetails[feedType] || 0) - details[feedType]);
      });
      updateData.feedDetails = newFeedDetails;
    }

    const updatedInventory = await prisma.inventory.update({
      where: { id: inventory.id },
      data: updateData,
    });

    return {
      success: true,
      data: updatedInventory,
    };
  } catch (error) {
    console.error("Error deducting from inventory:", error);
    return {
      success: false,
      error: "Failed to deduct from inventory",
    };
  }
}
