import { ExpenseCategory, RevenueSource } from "@/lib/generated/prisma";

// Color mapping for expense categories - following feed type color pattern
export const getExpenseCategoryBadgeColor = (category: ExpenseCategory): string => {
  const colorMap: Record<ExpenseCategory, string> = {
    feed: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    medicine: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", 
    labor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    utilities: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    maintenance: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  };
  
  return colorMap[category] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
};

// Color mapping for revenue sources - following feed type color pattern
export const getRevenueSourceBadgeColor = (source: RevenueSource): string => {
  const colorMap: Record<RevenueSource, string> = {
    egg_sales: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    bird_sales: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    manure: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    other: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  };
  
  return colorMap[source] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
};

