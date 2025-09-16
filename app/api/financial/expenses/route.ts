import { NextRequest, NextResponse } from "next/server";
import { createExpense, getExpenses } from "@/server/financial";
import { ExpenseCategory } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      flockId: searchParams.get("flockId") || undefined,
      category: searchParams.get("category") as ExpenseCategory || undefined,
      startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
    };

    const expenses = await getExpenses(filters);
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const expense = await createExpense({
      flockId: body.flockId,
      category: body.category,
      amount: parseFloat(body.amount),
      date: new Date(body.date),
      description: body.description,
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
