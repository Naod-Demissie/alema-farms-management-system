import { NextRequest, NextResponse } from "next/server";
import { getFlockFinancialSummaries } from "@/server/financial";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      flockId: searchParams.get("flockId") || undefined,
      startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
    };

    const summaries = await getFlockFinancialSummaries(filters);
    return NextResponse.json(summaries);
  } catch (error) {
    console.error("Error fetching flock financial summaries:", error);
    return NextResponse.json(
      { error: "Failed to fetch flock financial summaries" },
      { status: 500 }
    );
  }
}
