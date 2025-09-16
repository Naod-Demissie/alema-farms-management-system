import { NextRequest, NextResponse } from "next/server";
import { updateRevenue, deleteRevenue } from "@/server/financial";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const revenue = await updateRevenue(params.id, {
      source: body.source,
      amount: body.amount ? parseFloat(body.amount) : undefined,
      date: body.date ? new Date(body.date) : undefined,
      description: body.description,
    });

    return NextResponse.json(revenue);
  } catch (error) {
    console.error("Error updating revenue:", error);
    return NextResponse.json(
      { error: "Failed to update revenue" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteRevenue(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting revenue:", error);
    return NextResponse.json(
      { error: "Failed to delete revenue" },
      { status: 500 }
    );
  }
}
