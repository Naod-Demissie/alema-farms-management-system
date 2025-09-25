"use server";

import { prisma } from "@/lib/prisma";
import { ExpenseCategory, RevenueSource } from "@/lib/generated/prisma";
import { 
  FinancialSummary, 
  ExpenseSummary, 
  RevenueSummary, 
  FlockFinancialSummary, 
  MonthlyFinancialData,
  FinancialFilters 
} from "@/features/financial/types";
import { revalidatePath } from "next/cache";

// Expense Management Server Actions
export async function createExpense(data: {
  flockId: string;
  category: ExpenseCategory;
  amount: number;
  date: Date;
  description?: string;
}) {
  try {
    const expense = await prisma.expenses.create({
      data: {
        flockId: data.flockId,
        category: data.category,
        amount: data.amount,
        date: data.date,
        description: data.description,
      },
      include: {
        flock: {
          select: {
            batchCode: true,
            breed: true,
          },
        },
      },
    });
    
    revalidatePath("/financial");
    return { success: true, data: expense };
  } catch (error) {
    console.error("Error creating expense:", error);
    return { success: false, message: "Failed to create expense" };
  }
}

export async function updateExpense(id: string, data: {
  category?: ExpenseCategory;
  amount?: number;
  date?: Date;
  description?: string;
}) {
  try {
    const expense = await prisma.expenses.update({
      where: { id },
      data,
      include: {
        flock: {
          select: {
            batchCode: true,
            breed: true,
          },
        },
      },
    });
    
    revalidatePath("/financial");
    return { success: true, data: expense };
  } catch (error) {
    console.error("Error updating expense:", error);
    return { success: false, message: "Failed to update expense" };
  }
}

export async function deleteExpense(id: string) {
  try {
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

export async function getExpenses(filters: FinancialFilters = {}) {
  try {
    const where: any = {};
    
    if (filters.flockId) {
      where.flockId = filters.flockId;
    }
    
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
      include: {
        flock: {
          select: {
            batchCode: true,
            breed: true,
          },
        },
      },
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
  flockId: string;
  source: RevenueSource;
  quantity: number;
  costPerQuantity: number;
  amount: number;
  date: Date;
  description?: string;
}) {
  try {
    const revenue = await prisma.revenue.create({
      data: {
        flockId: data.flockId,
        source: data.source,
        quantity: data.quantity,
        costPerQuantity: data.costPerQuantity,
        amount: data.amount,
        date: data.date,
        description: data.description,
      },
      include: {
        flock: {
          select: {
            batchCode: true,
            breed: true,
          },
        },
      },
    });
    
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
}) {
  try {
    const revenue = await prisma.revenue.update({
      where: { id },
      data,
      include: {
        flock: {
          select: {
            batchCode: true,
            breed: true,
          },
        },
      },
    });
    
    revalidatePath("/financial");
    return { success: true, data: revenue };
  } catch (error) {
    console.error("Error updating revenue:", error);
    return { success: false, message: "Failed to update revenue" };
  }
}

export async function deleteRevenue(id: string) {
  try {
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
    
    if (filters.flockId) {
      where.flockId = filters.flockId;
    }
    
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
      include: {
        flock: {
          select: {
            batchCode: true,
            breed: true,
          },
        },
      },
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
        breed: true,
        arrivalDate: true,
      },
    });

    const summaries: FlockFinancialSummary[] = [];

    for (const flock of flocks) {
      const flockFilters = { ...filters, flockId: flock.id };
      const [expensesResult, revenueResult] = await Promise.all([
        getExpenses(flockFilters),
        getRevenue(flockFilters),
      ]);

      if (!expensesResult.success || !revenueResult.success) {
        continue; // Skip this flock if data fetch failed
      }

      const expenses = expensesResult.data || [];
      const revenue = revenueResult.data || [];

      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalRevenue = revenue.reduce((sum, rev) => sum + rev.amount, 0);
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      summaries.push({
        flockId: flock.id,
        batchCode: flock.batchCode,
        breed: flock.breed,
        totalExpenses,
        totalRevenue,
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
