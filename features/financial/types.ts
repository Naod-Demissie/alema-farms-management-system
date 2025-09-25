import { ExpenseCategory, RevenueSource } from "@/lib/generated/prisma";

export interface FinancialSummary {
  totalExpenses: number;
  totalRevenue: number;
  netProfit: number;
  profitMargin: number;
}

export interface ExpenseSummary {
  category: ExpenseCategory;
  totalAmount: number;
  percentage: number;
  count: number;
}

export interface RevenueSummary {
  source: RevenueSource;
  totalAmount: number;
  percentage: number;
  count: number;
}

export interface FlockFinancialSummary {
  flockId: string;
  batchCode: string;
  breed: string;
  totalExpenses: number;
  totalRevenue: number;
  netProfit: number;
  profitMargin: number;
  startDate: Date;
  endDate?: Date;
}

export interface MonthlyFinancialData {
  month: string;
  year: number;
  expenses: number;
  revenue: number;
  profit: number;
}

export interface ExpenseFormData {
  flockId: string;
  category: ExpenseCategory;
  quantity: number;
  costPerQuantity: number;
  amount: number;
  date: Date;
  description?: string;
}

export interface RevenueFormData {
  flockId: string;
  source: RevenueSource;
  quantity: number;
  costPerQuantity: number;
  amount: number;
  date: Date;
  description?: string;
}

export interface FinancialFilters {
  flockId?: string;
  startDate?: Date;
  endDate?: Date;
  category?: ExpenseCategory;
  source?: RevenueSource;
}

export const EXPENSE_CATEGORIES = [
  { value: "feed", label: "Feed" },
  { value: "medicine", label: "Medicine" },
  { value: "labor", label: "Labor" },
  { value: "utilities", label: "Utilities" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
] as const;

export const REVENUE_SOURCES = [
  { value: "egg_sales", label: "Egg Sales" },
  { value: "bird_sales", label: "Bird Sales" },
  { value: "manure", label: "Manure" },
  { value: "other", label: "Other" },
] as const;
