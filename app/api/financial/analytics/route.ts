import { NextRequest, NextResponse } from "next/server";
import { getFinancialAnalytics } from "@/server/financial";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      flockId: searchParams.get("flockId") || undefined,
      startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
    };

    const analytics = await getFinancialAnalytics(filters);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching financial analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial analytics" },
      { status: 500 }
    );
  }
}
