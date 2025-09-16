import { NextRequest, NextResponse } from "next/server";
import { createRevenue, getRevenue } from "@/server/financial";
import { RevenueSource } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      flockId: searchParams.get("flockId") || undefined,
      source: searchParams.get("source") as RevenueSource || undefined,
      startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
    };

    const revenue = await getRevenue(filters);
    return NextResponse.json(revenue);
  } catch (error) {
    console.error("Error fetching revenue:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const revenue = await createRevenue({
      flockId: body.flockId,
      source: body.source,
      amount: parseFloat(body.amount),
      date: new Date(body.date),
      description: body.description,
    });

    return NextResponse.json(revenue, { status: 201 });
  } catch (error) {
    console.error("Error creating revenue:", error);
    return NextResponse.json(
      { error: "Failed to create revenue" },
      { status: 500 }
    );
  }
}
