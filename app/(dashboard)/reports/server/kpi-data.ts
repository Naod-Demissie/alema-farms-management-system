"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-middleware";
import { ApiResponse } from "@/lib/types";

// Function to get date range based on period
function getDateRange(period: string) {
  const now = new Date();
  const start = new Date();
  
  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      return { start, end: new Date(now.getTime() + 24 * 60 * 60 * 1000) };
    case "week":
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    case "month":
      start.setMonth(now.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    case "3months":
      start.setMonth(now.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    case "6months":
      start.setMonth(now.getMonth() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    case "year":
      start.setFullYear(now.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    default:
      start.setHours(0, 0, 0, 0);
      return { start, end: new Date(now.getTime() + 24 * 60 * 60 * 1000) };
  }
}

// Fetch production data for a specific period
export async function getProductionData(period: string): Promise<ApiResponse<number>> {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const { start, end } = getDateRange(period);
    
    const result = await prisma.eggProduction.aggregate({
      where: { 
        date: { 
          gte: start, 
          lt: end 
        } 
      },
      _sum: { totalCount: true }
    });
    
    return {
      success: true,
      data: result._sum.totalCount || 0
    };
  } catch (error) {
    console.error("Error fetching production data:", error);
    return {
      success: false,
      message: "Failed to fetch production data",
      data: 0
    };
  }
}

// Fetch expenses data for a specific period
export async function getExpensesData(period: string): Promise<ApiResponse<number>> {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const { start, end } = getDateRange(period);
    
    const result = await prisma.expenses.aggregate({
      where: { 
        date: { 
          gte: start, 
          lt: end 
        } 
      },
      _sum: { amount: true }
    });
    
    return {
      success: true,
      data: result._sum.amount || 0
    };
  } catch (error) {
    console.error("Error fetching expenses data:", error);
    return {
      success: false,
      message: "Failed to fetch expenses data",
      data: 0
    };
  }
}

// Fetch revenue data for a specific period
export async function getRevenueData(period: string): Promise<ApiResponse<number>> {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const { start, end } = getDateRange(period);
    
    const result = await prisma.revenue.aggregate({
      where: { 
        date: { 
          gte: start, 
          lt: end 
        } 
      },
      _sum: { amount: true }
    });
    
    return {
      success: true,
      data: result._sum.amount || 0
    };
  } catch (error) {
    console.error("Error fetching revenue data:", error);
    return {
      success: false,
      message: "Failed to fetch revenue data",
      data: 0
    };
  }
}

// Fetch all KPI data for a specific period
export async function getKPIData(period: string): Promise<ApiResponse<{
  production: number;
  expenses: number;
  revenue: number;
}>> {
  try {
    const authResult = await getAuthenticatedUser();
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.message || "Authentication required"
      };
    }

    const [productionResult, expensesResult, revenueResult] = await Promise.all([
      getProductionData(period),
      getExpensesData(period),
      getRevenueData(period)
    ]);

    return {
      success: true,
      data: {
        production: productionResult.data || 0,
        expenses: expensesResult.data || 0,
        revenue: revenueResult.data || 0
      }
    };
  } catch (error) {
    console.error("Error fetching KPI data:", error);
    return {
      success: false,
      message: "Failed to fetch KPI data",
      data: {
        production: 0,
        expenses: 0,
        revenue: 0
      }
    };
  }
}
