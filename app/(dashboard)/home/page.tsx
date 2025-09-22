import { prisma } from "@/lib/prisma";
import HomeClient from "./home-client";

export default async function HomePage() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Eggs today
  const eggsTodayAgg = await prisma.eggProduction.aggregate({
    where: { date: { gte: todayStart, lt: tomorrow } },
    _sum: { totalCount: true }
  });
  const eggsToday = eggsTodayAgg._sum.totalCount || 0;

  // Expenses today
  const expensesAgg = await prisma.expenses.aggregate({
    where: { date: { gte: todayStart, lt: tomorrow } },
    _sum: { amount: true }
  });
  const expensesToday = expensesAgg._sum.amount || 0;

  // Sales today
  const salesAgg = await prisma.revenue.aggregate({
    where: { date: { gte: todayStart, lt: tomorrow } },
    _sum: { amount: true }
  });
  const salesToday = salesAgg._sum.amount || 0;

  // Feed left in stock
  const feedAgg = await prisma.feedInventory.aggregate({ _sum: { quantity: true } });
  const feedLeft = feedAgg._sum.quantity || 0;

  return <HomeClient summary={{ eggsToday, expensesToday, salesToday, feedLeft }} />;
}
