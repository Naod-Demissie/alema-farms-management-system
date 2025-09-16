import { prisma } from "@/lib/prisma";
import { ExpenseCategory, RevenueSource } from "@prisma/client";
import { 
  FinancialSummary, 
  ExpenseSummary, 
  RevenueSummary, 
  FlockFinancialSummary, 
  MonthlyFinancialData,
  FinancialFilters 
} from "@/features/financial/types";

// Expense Management
export async function createExpense(data: {
  flockId: string;
  category: ExpenseCategory;
  amount: number;
  date: Date;
  description?: string;
}) {
  return await prisma.expenses.create({
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
}

export async function updateExpense(id: string, data: {
  category?: ExpenseCategory;
  amount?: number;
  date?: Date;
  description?: string;
}) {
  return await prisma.expenses.update({
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
}

export async function deleteExpense(id: string) {
  return await prisma.expenses.delete({
    where: { id },
  });
}

export async function getExpenses(filters: FinancialFilters = {}) {
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

  return await prisma.expenses.findMany({
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
}

// Revenue Management
export async function createRevenue(data: {
  flockId: string;
  source: RevenueSource;
  amount: number;
  date: Date;
  description?: string;
}) {
  return await prisma.revenue.create({
    data: {
      flockId: data.flockId,
      source: data.source,
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
}

export async function updateRevenue(id: string, data: {
  source?: RevenueSource;
  amount?: number;
  date?: Date;
  description?: string;
}) {
  return await prisma.revenue.update({
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
}

export async function deleteRevenue(id: string) {
  return await prisma.revenue.delete({
    where: { id },
  });
}

export async function getRevenue(filters: FinancialFilters = {}) {
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

  return await prisma.revenue.findMany({
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
}

// Financial Summaries
export async function getFinancialSummary(filters: FinancialFilters = {}): Promise<FinancialSummary> {
  const [expenses, revenue] = await Promise.all([
    getExpenses(filters),
    getRevenue(filters),
  ]);

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalRevenue = revenue.reduce((sum, rev) => sum + rev.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return {
    totalExpenses,
    totalRevenue,
    netProfit,
    profitMargin,
  };
}

export async function getExpenseSummary(filters: FinancialFilters = {}): Promise<ExpenseSummary[]> {
  const expenses = await getExpenses(filters);
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const categories = Object.values(ExpenseCategory);
  
  return categories.map(category => {
    const categoryExpenses = expenses.filter(expense => expense.category === category);
    const total = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    return {
      category,
      totalAmount: total,
      percentage: totalAmount > 0 ? (total / totalAmount) * 100 : 0,
      count: categoryExpenses.length,
    };
  });
}

export async function getRevenueSummary(filters: FinancialFilters = {}): Promise<RevenueSummary[]> {
  const revenue = await getRevenue(filters);
  const totalAmount = revenue.reduce((sum, rev) => sum + rev.amount, 0);

  const sources = Object.values(RevenueSource);
  
  return sources.map(source => {
    const sourceRevenue = revenue.filter(rev => rev.source === source);
    const total = sourceRevenue.reduce((sum, rev) => sum + rev.amount, 0);
    
    return {
      source,
      totalAmount: total,
      percentage: totalAmount > 0 ? (total / totalAmount) * 100 : 0,
      count: sourceRevenue.length,
    };
  });
}

export async function getFlockFinancialSummaries(filters: FinancialFilters = {}): Promise<FlockFinancialSummary[]> {
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
    const [expenses, revenue] = await Promise.all([
      getExpenses(flockFilters),
      getRevenue(flockFilters),
    ]);

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

  return summaries;
}

export async function getMonthlyFinancialData(filters: FinancialFilters = {}): Promise<MonthlyFinancialData[]> {
  const [expenses, revenue] = await Promise.all([
    getExpenses(filters),
    getRevenue(filters),
  ]);

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

  return Array.from(monthlyData.entries()).map(([key, data]) => {
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
}

// Analytics
export async function getFinancialAnalytics(filters: FinancialFilters = {}) {
  const [
    expenseSummary,
    revenueSummary,
    monthlyData,
    financialSummary,
  ] = await Promise.all([
    getExpenseSummary(filters),
    getRevenueSummary(filters),
    getMonthlyFinancialData(filters),
    getFinancialSummary(filters),
  ]);

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
  };
}
