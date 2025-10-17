"use server";

import { prisma } from "@/lib/prisma";
import { ExpenseCategory, RevenueSource, InventoryType } from "@/lib/generated/prisma/enums";
import { 
  FinancialSummary, 
  ExpenseSummary, 
  RevenueSummary, 
  FlockFinancialSummary, 
  MonthlyFinancialData,
  FinancialFilters 
} from "../types/types";
import { deductFromInventory, addToInventory } from "@/app/(dashboard)/feed/server/inventory-service";
import { revalidatePath } from "next/cache";

// Expense Management Server Actions
export async function createExpense(data: {
  category: ExpenseCategory;
  quantity: number;
  costPerQuantity: number;
  amount: number;
  date: Date;
  description?: string;
  sourceId?: string;
  sourceType?: string;
}) {
  try {
    const expense = await prisma.expenses.create({
      data: {
        category: data.category,
        quantity: data.quantity,
        costPerQuantity: data.costPerQuantity,
        amount: data.amount,
        date: data.date,
        description: data.description,
        sourceId: data.sourceId,
        sourceType: data.sourceType,
      },
    });

    // Deduct from inventory when expense is recorded (for usage)
    if (data.category === "feed" || data.category === "medicine") {
      const inventoryType = data.category === "feed" ? InventoryType.FEED : InventoryType.MEDICINE;
      const inventoryResult = await deductFromInventory(inventoryType, data.quantity);
      
      if (!inventoryResult.success) {
        console.warn("Failed to update inventory:", inventoryResult.error);
        // Don't fail the expense creation if inventory update fails
      }
    }

    revalidatePath("/financial");
    return { success: true, data: expense };
  } catch (error) {
    console.error("Error creating expense:", error);
    return { success: false, message: "Failed to create expense" };
  }
}

export async function updateExpense(id: string, data: {
  category?: ExpenseCategory;
  quantity?: number;
  costPerQuantity?: number;
  amount?: number;
  date?: Date;
  description?: string;
  sourceId?: string;
  sourceType?: string;
}) {
  try {
    // Get the existing expense record to calculate inventory differences
    const existingExpense = await prisma.expenses.findUnique({
      where: { id }
    });

    if (!existingExpense) {
      return { success: false, message: "Expense record not found" };
    }

    const expense = await prisma.expenses.update({
      where: { id },
      data,
    });

    // Handle inventory updates for feed/medicine expenses
    if ((existingExpense.category === "feed" || existingExpense.category === "medicine") && 
        (data.category === "feed" || data.category === "medicine")) {
      
      const inventoryType = existingExpense.category === "feed" ? InventoryType.FEED : InventoryType.MEDICINE;
      
      // If quantity changed, adjust inventory
      if (data.quantity !== undefined && data.quantity !== existingExpense.quantity) {
        const quantityDifference = data.quantity - existingExpense.quantity;
        
        if (quantityDifference > 0) {
          // Add back the difference (expense increased)
          const inventoryResult = await addToInventory(inventoryType, quantityDifference);
          if (!inventoryResult.success) {
            console.warn("Failed to update inventory:", inventoryResult.error);
          }
        } else {
          // Deduct the difference (expense decreased)
          const inventoryResult = await deductFromInventory(inventoryType, Math.abs(quantityDifference));
          if (!inventoryResult.success) {
            console.warn("Failed to update inventory:", inventoryResult.error);
          }
        }
      }
    }
    
    revalidatePath("/financial");
    return { success: true, data: expense };
  } catch (error) {
    console.error("Error updating expense:", error);
    return { success: false, message: "Failed to update expense" };
  }
}

export async function deleteExpense(id: string) {
  try {
    // Get the existing expense record to restore inventory
    const existingExpense = await prisma.expenses.findUnique({
      where: { id }
    });

    if (!existingExpense) {
      return { success: false, message: "Expense record not found" };
    }

    // Restore inventory for feed/medicine expenses
    if (existingExpense.category === "feed" || existingExpense.category === "medicine") {
      const inventoryType = existingExpense.category === "feed" ? InventoryType.FEED : InventoryType.MEDICINE;
      const inventoryResult = await addToInventory(inventoryType, existingExpense.quantity);
      
      if (!inventoryResult.success) {
        console.warn("Failed to restore inventory:", inventoryResult.error);
        // Don't fail the deletion if inventory update fails
      }
    }

    await prisma.expenses.delete({
      where: { id },
    });
    
    revalidatePath("/financial");
    return { success: true };
  } catch (error) {
    console.error("Error deleting expense:", error);
    return { success: false, message: "Failed to delete expense" };
  }
}

export async function getExpenseBySource(sourceId: string, sourceType: string) {
  try {
    const expense = await prisma.expenses.findFirst({
      where: { 
        sourceId: sourceId,
        sourceType: sourceType 
      }
    });

    if (!expense) {
      return { success: false, message: "No linked expense found" };
    }

    return { success: true, data: expense };
  } catch (error) {
    console.error("Error getting expense by source:", error);
    return { success: false, message: "Failed to get expense by source" };
  }
}

export async function updateExpenseBySource(sourceId: string, sourceType: string, data: {
  quantity?: number;
  costPerQuantity?: number;
  amount?: number;
  description?: string;
}) {
  try {
    const expense = await prisma.expenses.findFirst({
      where: { 
        sourceId: sourceId,
        sourceType: sourceType 
      }
    });

    if (!expense) {
      return { success: false, message: "No linked expense found" };
    }

    return await updateExpense(expense.id, data);
  } catch (error) {
    console.error("Error updating expense by source:", error);
    return { success: false, message: "Failed to update expense by source" };
  }
}

export async function deleteExpenseBySource(sourceId: string, sourceType: string) {
  try {
    // Find the expense record by sourceId and sourceType
    const expense = await prisma.expenses.findFirst({
      where: { 
        sourceId: sourceId,
        sourceType: sourceType 
      }
    });

    if (!expense) {
      return { success: true, message: "No linked expense found" };
    }

    // Delete the expense using the existing deleteExpense function
    return await deleteExpense(expense.id);
  } catch (error) {
    console.error("Error deleting expense by source:", error);
    return { success: false, message: "Failed to delete expense by source" };
  }
}

export async function getExpenses(filters: FinancialFilters = {}) {
  try {
    const where: any = {};
    
    // Note: Expenses don't have flockId field - they are farm-wide records
    // if (filters.flockId) {
    //   where.flockId = filters.flockId;
    // }
    
    if (filters.category) {
      where.category = filters.category;
    }
    
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.date.lte = filters.endDate;
      }
    }

    const expenses = await prisma.expenses.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
    });
    
    return { success: true, data: expenses };
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return { success: false, message: "Failed to fetch expenses", data: [] };
  }
}

// Revenue Management Server Actions
export async function createRevenue(data: {
  source: RevenueSource;
  quantity: number;
  costPerQuantity: number;
  amount: number;
  date: Date;
  description?: string;
  transactionBy?: string;
  bankName?: string;
  bankAccountNumber?: string;
}) {
  try {
    const revenue = await prisma.revenue.create({
      data: {
        source: data.source,
        quantity: data.quantity,
        costPerQuantity: data.costPerQuantity,
        amount: data.amount,
        date: data.date,
        description: data.description,
        transactionBy: data.transactionBy,
        bankName: data.bankName as any,
        bankAccountNumber: data.bankAccountNumber,
      },
    });

    // Handle inventory updates based on revenue source
    if (data.source === "egg_sales") {
      // Deduct eggs from inventory when sold
      const inventoryResult = await deductFromInventory(InventoryType.EGG, data.quantity);
      if (!inventoryResult.success) {
        console.warn("Failed to update egg inventory:", inventoryResult.error);
      }
    } else if (data.source === "bird_sales") {
      // Deduct broilers from inventory when sold
      // Note: Flock current count should already be updated when broiler sales record was created
      const inventoryResult = await deductFromInventory(InventoryType.BROILER, data.quantity);
      if (!inventoryResult.success) {
        console.warn("Failed to update broiler inventory:", inventoryResult.error);
      }
    } else if (data.source === "manure") {
      // Deduct manure from inventory when sold
      const inventoryResult = await deductFromInventory(InventoryType.MANURE, data.quantity);
      if (!inventoryResult.success) {
        console.warn("Failed to update manure inventory:", inventoryResult.error);
      }
    }

    revalidatePath("/financial");
    return { success: true, data: revenue };
  } catch (error) {
    console.error("Error creating revenue:", error);
    return { success: false, message: "Failed to create revenue" };
  }
}

export async function updateRevenue(id: string, data: {
  source?: RevenueSource;
  quantity?: number;
  costPerQuantity?: number;
  amount?: number;
  date?: Date;
  description?: string;
  transactionBy?: string;
  bankName?: string;
  bankAccountNumber?: string;
}) {
  try {
    // Get the existing revenue record to calculate inventory differences
    const existingRevenue = await prisma.revenue.findUnique({
      where: { id }
    });

    if (!existingRevenue) {
      return { success: false, message: "Revenue record not found" };
    }

    const revenue = await prisma.revenue.update({
      where: { id },
      data: {
        ...data,
        bankName: data.bankName as any,
      },
    });

    // Handle inventory updates for sales revenue
    if ((existingRevenue.source === "egg_sales" || existingRevenue.source === "bird_sales" || existingRevenue.source === "manure") && 
        (data.source === "egg_sales" || data.source === "bird_sales" || data.source === "manure")) {
      
      let inventoryType: InventoryType;
      if (existingRevenue.source === "egg_sales") inventoryType = InventoryType.EGG;
      else if (existingRevenue.source === "bird_sales") inventoryType = InventoryType.BROILER;
      else inventoryType = InventoryType.MANURE;
      
      // If quantity changed, adjust inventory
      if (data.quantity !== undefined && data.quantity !== existingRevenue.quantity) {
        const quantityDifference = data.quantity - existingRevenue.quantity;
        
        if (quantityDifference > 0) {
          // Add back the difference (sales decreased)
          const inventoryResult = await addToInventory(inventoryType, quantityDifference);
          if (!inventoryResult.success) {
            console.warn("Failed to update inventory:", inventoryResult.error);
          }
        } else {
          // Deduct the difference (sales increased)
          const inventoryResult = await deductFromInventory(inventoryType, Math.abs(quantityDifference));
          if (!inventoryResult.success) {
            console.warn("Failed to update inventory:", inventoryResult.error);
          }
        }
      }
    }
    
    revalidatePath("/financial");
    return { success: true, data: revenue };
  } catch (error) {
    console.error("Error updating revenue:", error);
    return { success: false, message: "Failed to update revenue" };
  }
}

export async function deleteRevenue(id: string) {
  try {
    // Get the existing revenue record to restore inventory
    const existingRevenue = await prisma.revenue.findUnique({
      where: { id }
    });

    if (!existingRevenue) {
      return { success: false, message: "Revenue record not found" };
    }

    // Restore inventory for sales revenue
    if (existingRevenue.source === "egg_sales") {
      const inventoryResult = await addToInventory(InventoryType.EGG, existingRevenue.quantity);
      if (!inventoryResult.success) {
        console.warn("Failed to restore egg inventory:", inventoryResult.error);
      }
    } else if (existingRevenue.source === "bird_sales") {
      const inventoryResult = await addToInventory(InventoryType.BROILER, existingRevenue.quantity);
      if (!inventoryResult.success) {
        console.warn("Failed to restore broiler inventory:", inventoryResult.error);
      }
    } else if (existingRevenue.source === "manure") {
      const inventoryResult = await addToInventory(InventoryType.MANURE, existingRevenue.quantity);
      if (!inventoryResult.success) {
        console.warn("Failed to restore manure inventory:", inventoryResult.error);
      }
    }

    await prisma.revenue.delete({
      where: { id },
    });
    
    revalidatePath("/financial");
    return { success: true };
  } catch (error) {
    console.error("Error deleting revenue:", error);
    return { success: false, message: "Failed to delete revenue" };
  }
}

export async function getRevenue(filters: FinancialFilters = {}) {
  try {
    const where: any = {};
    
    // Note: Revenue doesn't have flockId field - they are farm-wide records
    // if (filters.flockId) {
    //   where.flockId = filters.flockId;
    // }
    
    if (filters.source) {
      where.source = filters.source;
    }
    
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.date.lte = filters.endDate;
      }
    }

    const revenue = await prisma.revenue.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
    });
    
    return { success: true, data: revenue };
  } catch (error) {
    console.error("Error fetching revenue:", error);
    return { success: false, message: "Failed to fetch revenue", data: [] };
  }
}

// Financial Summaries
export async function getFinancialSummary(filters: FinancialFilters = {}) {
  try {
    const [expensesResult, revenueResult] = await Promise.all([
      getExpenses(filters),
      getRevenue(filters),
    ]);

    if (!expensesResult.success || !revenueResult.success) {
      return { success: false, message: "Failed to fetch financial data" };
    }

    const expenses = expensesResult.data || [];
    const revenue = revenueResult.data || [];

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalRevenue = revenue.reduce((sum, rev) => sum + rev.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      success: true,
      data: {
        totalExpenses,
        totalRevenue,
        netProfit,
        profitMargin,
      }
    };
  } catch (error) {
    console.error("Error fetching financial summary:", error);
    return { success: false, message: "Failed to fetch financial summary" };
  }
}

export async function getExpenseSummary(filters: FinancialFilters = {}) {
  try {
    const expensesResult = await getExpenses(filters);
    
    if (!expensesResult.success) {
      return { success: false, message: "Failed to fetch expenses", data: [] };
    }

    const expenses = expensesResult.data || [];
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    const categories = Object.values(ExpenseCategory);
    
    const summary = categories.map(category => {
      const categoryExpenses = expenses.filter(expense => expense.category === category);
      const total = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      return {
        category,
        totalAmount: total,
        percentage: totalAmount > 0 ? (total / totalAmount) * 100 : 0,
        count: categoryExpenses.length,
      };
    });

    return { success: true, data: summary };
  } catch (error) {
    console.error("Error fetching expense summary:", error);
    return { success: false, message: "Failed to fetch expense summary", data: [] };
  }
}

export async function getRevenueSummary(filters: FinancialFilters = {}) {
  try {
    const revenueResult = await getRevenue(filters);
    
    if (!revenueResult.success) {
      return { success: false, message: "Failed to fetch revenue", data: [] };
    }

    const revenue = revenueResult.data || [];
    const totalAmount = revenue.reduce((sum, rev) => sum + rev.amount, 0);

    const sources = Object.values(RevenueSource);
    
    const summary = sources.map(source => {
      const sourceRevenue = revenue.filter(rev => rev.source === source);
      const total = sourceRevenue.reduce((sum, rev) => sum + rev.amount, 0);
      
      return {
        source,
        totalAmount: total,
        percentage: totalAmount > 0 ? (total / totalAmount) * 100 : 0,
        count: sourceRevenue.length,
      };
    });

    return { success: true, data: summary };
  } catch (error) {
    console.error("Error fetching revenue summary:", error);
    return { success: false, message: "Failed to fetch revenue summary", data: [] };
  }
}

export async function getFlockFinancialSummaries(filters: FinancialFilters = {}) {
  try {
    const flocks = await prisma.flocks.findMany({
      where: filters.flockId ? { id: filters.flockId } : {},
      select: {
        id: true,
        batchCode: true,
        arrivalDate: true,
      },
    });

    const summaries: FlockFinancialSummary[] = [];

    // Get farm-wide expenses and revenue (since they don't have flockId)
    const expensesResult = await getExpenses(filters);
    const revenueResult = await getRevenue(filters);

    if (!expensesResult.success || !revenueResult.success) {
      return { success: false, message: "Failed to fetch financial data", data: [] };
    }

    const allExpenses = expensesResult.data || [];
    const allRevenue = revenueResult.data || [];

    // Calculate total farm expenses and revenue
    const totalFarmExpenses = allExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalFarmRevenue = allRevenue.reduce((sum, rev) => sum + rev.amount, 0);

    for (const flock of flocks) {
      // Since expenses and revenue are farm-wide, we'll distribute them proportionally
      // based on flock count or use a different allocation method
      const flockCount = flocks.length;
      const flockExpenses = flockCount > 0 ? totalFarmExpenses / flockCount : 0;
      const flockRevenue = flockCount > 0 ? totalFarmRevenue / flockCount : 0;

      const netProfit = flockRevenue - flockExpenses;
      const profitMargin = flockRevenue > 0 ? (netProfit / flockRevenue) * 100 : 0;

      summaries.push({
        flockId: flock.id,
        batchCode: flock.batchCode,
        totalExpenses: flockExpenses,
        totalRevenue: flockRevenue,
        netProfit,
        profitMargin,
        startDate: flock.arrivalDate,
        endDate: undefined, // Could be calculated based on flock lifecycle
      });
    }

    return { success: true, data: summaries };
  } catch (error) {
    console.error("Error fetching flock financial summaries:", error);
    return { success: false, message: "Failed to fetch flock financial summaries", data: [] };
  }
}

export async function getDailyFinancialData(filters: FinancialFilters = {}) {
  try {
    const [expensesResult, revenueResult] = await Promise.all([
      getExpenses(filters),
      getRevenue(filters),
    ]);

    if (!expensesResult.success || !revenueResult.success) {
      return { success: false, message: "Failed to fetch financial data", data: [] };
    }

    const expenses = expensesResult.data || [];
    const revenue = revenueResult.data || [];

    // Group by date
    const dailyData = new Map<string, { expenses: number; revenue: number }>();

    expenses.forEach(expense => {
      const dateKey = expense.date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, { expenses: 0, revenue: 0 });
      }
      
      const data = dailyData.get(dateKey)!;
      data.expenses += expense.amount;
    });

    revenue.forEach(rev => {
      const dateKey = rev.date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, { expenses: 0, revenue: 0 });
      }
      
      const data = dailyData.get(dateKey)!;
      data.revenue += rev.amount;
    });

    const dailyDataArray = Array.from(dailyData.entries()).map(([dateKey, data]) => ({
      date: dateKey,
      expenses: data.expenses,
      revenue: data.revenue,
      profit: data.revenue - data.expenses,
    })).sort((a, b) => a.date.localeCompare(b.date));

    return { success: true, data: dailyDataArray };
  } catch (error) {
    console.error("Error fetching daily financial data:", error);
    return { success: false, message: "Failed to fetch daily financial data", data: [] };
  }
}

export async function getMonthlyFinancialData(filters: FinancialFilters = {}) {
  try {
    const [expensesResult, revenueResult] = await Promise.all([
      getExpenses(filters),
      getRevenue(filters),
    ]);

    if (!expensesResult.success || !revenueResult.success) {
      return { success: false, message: "Failed to fetch financial data", data: [] };
    }

    const expenses = expensesResult.data || [];
    const revenue = revenueResult.data || [];

    // Group by month
    const monthlyData = new Map<string, { expenses: number; revenue: number }>();

    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(key)) {
        monthlyData.set(key, { expenses: 0, revenue: 0 });
      }
      
      const data = monthlyData.get(key)!;
      data.expenses += expense.amount;
    });

    revenue.forEach(rev => {
      const date = new Date(rev.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(key)) {
        monthlyData.set(key, { expenses: 0, revenue: 0 });
      }
      
      const data = monthlyData.get(key)!;
      data.revenue += rev.amount;
    });

    const monthlyDataArray = Array.from(monthlyData.entries()).map(([key, data]) => {
      const [year, month] = key.split('-');
      return {
        month,
        year: parseInt(year),
        expenses: data.expenses,
        revenue: data.revenue,
        profit: data.revenue - data.expenses,
      };
    }).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return parseInt(a.month) - parseInt(b.month);
    });

    return { success: true, data: monthlyDataArray };
  } catch (error) {
    console.error("Error fetching monthly financial data:", error);
    return { success: false, message: "Failed to fetch monthly financial data", data: [] };
  }
}

// Analytics
export async function getFinancialAnalytics(filters: FinancialFilters = {}) {
  try {
    const [
      expenseSummaryResult,
      revenueSummaryResult,
      monthlyDataResult,
      financialSummaryResult,
    ] = await Promise.all([
      getExpenseSummary(filters),
      getRevenueSummary(filters),
      getMonthlyFinancialData(filters),
      getFinancialSummary(filters),
    ]);

    if (!expenseSummaryResult.success || !revenueSummaryResult.success || 
        !monthlyDataResult.success || !financialSummaryResult.success) {
      return { success: false, message: "Failed to fetch analytics data" };
    }

    const expenseSummary = expenseSummaryResult.data || [];
    const revenueSummary = revenueSummaryResult.data || [];
    const monthlyData = monthlyDataResult.data || [];
    const financialSummary = financialSummaryResult.data || {
      totalExpenses: 0,
      totalRevenue: 0,
      netProfit: 0,
      profitMargin: 0,
    };

    const averageMonthlyProfit = monthlyData.length > 0 
      ? monthlyData.reduce((sum, month) => sum + month.profit, 0) / monthlyData.length 
      : 0;

    const bestPerformingMonth = monthlyData.length > 0 
      ? monthlyData.reduce((best, current) => current.profit > best.profit ? current : best)
      : null;

    const worstPerformingMonth = monthlyData.length > 0 
      ? monthlyData.reduce((worst, current) => current.profit < worst.profit ? current : worst)
      : null;

    return {
      success: true,
      data: {
        expenseSummary,
        revenueSummary,
        monthlyData,
        totalExpenses: financialSummary.totalExpenses,
        totalRevenue: financialSummary.totalRevenue,
        netProfit: financialSummary.netProfit,
        profitMargin: financialSummary.profitMargin,
        averageMonthlyProfit,
        bestPerformingMonth,
        worstPerformingMonth,
      }
    };
  } catch (error) {
    console.error("Error fetching financial analytics:", error);
    return { success: false, message: "Failed to fetch financial analytics" };
  }
}
