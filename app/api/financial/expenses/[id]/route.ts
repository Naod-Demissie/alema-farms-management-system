import { NextRequest, NextResponse } from "next/server";
import { updateExpense, deleteExpense } from "@/server/financial";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const expense = await updateExpense(params.id, {
      category: body.category,
      amount: body.amount ? parseFloat(body.amount) : undefined,
      date: body.date ? new Date(body.date) : undefined,
      description: body.description,
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteExpense(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
