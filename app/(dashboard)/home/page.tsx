import { prisma } from "@/lib/prisma";
import HomeClient from "./home-client";
import { getInventoryCounts } from "@/server/inventory-alerts";

// Force dynamic rendering to avoid build-time database calls
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Execute all queries in parallel for better performance
  const [homeSummary, inventoryCounts] = await Promise.all([
    // Single optimized query for all daily summaries
    prisma.$queryRaw<Array<{
      eggs_today: bigint;
      expenses_today: number;
      sales_today: number;
      feed_left: number;
    }>>`
      SELECT 
        COALESCE((
          SELECT SUM("totalCount")::bigint 
          FROM egg_production 
          WHERE date >= ${todayStart} AND date < ${tomorrow}
        ), 0) as eggs_today,
        COALESCE((
          SELECT SUM(amount) 
          FROM expenses 
          WHERE date >= ${todayStart} AND date < ${tomorrow}
        ), 0) as expenses_today,
        COALESCE((
          SELECT SUM(amount) 
          FROM revenue 
          WHERE date >= ${todayStart} AND date < ${tomorrow}
        ), 0) as sales_today,
        COALESCE((
          SELECT SUM(quantity) 
          FROM feed_inventory 
          WHERE "isActive" = true
        ), 0) as feed_left
    `,
    // Get inventory counts
    getInventoryCounts()
  ]);

  const summary = homeSummary[0];
  const eggsToday = Number(summary.eggs_today);
  const expensesToday = summary.expenses_today || 0;
  const salesToday = summary.sales_today || 0;
  const feedLeft = summary.feed_left || 0;

  return <HomeClient summary={{ eggsToday, expensesToday, salesToday, feedLeft }} inventoryCounts={inventoryCounts} />;
}
