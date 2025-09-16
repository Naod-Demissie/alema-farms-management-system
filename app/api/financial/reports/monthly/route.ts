import { NextRequest, NextResponse } from "next/server";
import { getMonthlyFinancialData } from "@/server/financial";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      flockId: searchParams.get("flockId") || undefined,
      startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
    };

    const monthlyData = await getMonthlyFinancialData(filters);
    return NextResponse.json(monthlyData);
  } catch (error) {
    console.error("Error fetching monthly financial data:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly financial data" },
      { status: 500 }
    );
  }
}
