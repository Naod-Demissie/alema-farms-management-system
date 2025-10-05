import { ExpenseCategory, RevenueSource, BankName } from "@/lib/generated/prisma/enums";

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
  category: ExpenseCategory;
  quantity: number;
  costPerQuantity: number;
  amount: number;
  date: Date;
  description?: string;
}

export interface RevenueFormData {
  source: RevenueSource;
  quantity: number;
  costPerQuantity: number;
  amount: number;
  date: Date;
  description?: string;
  transactionBy?: string;
  bankName?: BankName;
  bankAccountNumber?: string;
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

export const BANK_NAMES = [
  { value: "COMMERCIAL_BANK_OF_ETHIOPIA", label: "Commercial Bank of Ethiopia" },
  { value: "AWASH_BANK", label: "Awash Bank" },
  { value: "DASHEN_BANK", label: "Dashen Bank" },
  { value: "BANK_OF_ABYSSINIA", label: "Bank of Abyssinia" },
  { value: "WEGAGEN_BANK", label: "Wegagen Bank" },
  { value: "NIB_INTERNATIONAL_BANK", label: "Nib International Bank" },
  { value: "HIBRET_BANK", label: "Hibret Bank" },
  { value: "BERHAN_BANK", label: "Berhan Bank" },
  { value: "BUNNA_BANK", label: "Bunna International Bank" },
  { value: "ABAY_BANK", label: "Abay Bank" },
  { value: "ADDIS_BANK", label: "Addis International Bank" },
  { value: "OROMIA_BANK", label: "Oromia Bank" },
  { value: "LION_BANK", label: "Lion International Bank" },
  { value: "ZEMEN_BANK", label: "Zemen Bank" },
  { value: "ENAT_BANK", label: "Enat Bank" },
  { value: "DEBUB_GLOBAL_BANK", label: "Debub Global Bank" },
  { value: "SIINQEE_BANK", label: "Siinqee Bank" },
  { value: "AMHARA_BANK", label: "Amhara Bank" },
  { value: "TSEHAY_BANK", label: "Tsehay Bank" },
  { value: "ZAMZAM_BANK", label: "ZamZam Bank" },
  { value: "HIJRA_BANK", label: "Hijra Bank" },
  { value: "GOH_BETOCH_BANK", label: "Goh Betoch Bank" },
] as const;
