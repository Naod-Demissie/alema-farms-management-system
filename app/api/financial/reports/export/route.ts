import { NextRequest, NextResponse } from "next/server";
import { getFlockFinancialSummaries, getMonthlyFinancialData, getFinancialSummary } from "@/server/financial";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    
    const filters = {
      flockId: searchParams.get("flockId") || undefined,
      startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
    };

    const [flockSummaries, monthlyData, financialSummary] = await Promise.all([
      getFlockFinancialSummaries(filters),
      getMonthlyFinancialData(filters),
      getFinancialSummary(filters),
    ]);

    if (format === "csv") {
      const csv = generateCSV(flockSummaries, monthlyData, financialSummary);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="financial-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === "pdf") {
      // For PDF generation, you would typically use a library like puppeteer or jsPDF
      // For now, return a JSON response
      return NextResponse.json({
        message: "PDF export not implemented yet",
        data: { flockSummaries, monthlyData, financialSummary },
      });
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  } catch (error) {
    console.error("Error exporting financial report:", error);
    return NextResponse.json(
      { error: "Failed to export financial report" },
      { status: 500 }
    );
  }
}

function generateCSV(flockSummaries: any[], monthlyData: any[], financialSummary: any): string {
  let csv = "Financial Report\n";
  csv += `Generated: ${new Date().toISOString()}\n\n`;
  
  // Summary section
  csv += "SUMMARY\n";
  csv += "Total Revenue,Total Expenses,Net Profit,Profit Margin\n";
  csv += `${financialSummary.totalRevenue},${financialSummary.totalExpenses},${financialSummary.netProfit},${financialSummary.profitMargin.toFixed(2)}%\n\n`;
  
  // Flock summaries
  csv += "FLOCK FINANCIAL SUMMARIES\n";
  csv += "Flock ID,Batch Code,Breed,Total Revenue,Total Expenses,Net Profit,Profit Margin,Start Date\n";
  flockSummaries.forEach(flock => {
    csv += `${flock.flockId},${flock.batchCode},${flock.breed},${flock.totalRevenue},${flock.totalExpenses},${flock.netProfit},${flock.profitMargin.toFixed(2)}%,${flock.startDate.toISOString().split('T')[0]}\n`;
  });
  
  csv += "\n";
  
  // Monthly data
  csv += "MONTHLY FINANCIAL DATA\n";
  csv += "Month,Year,Revenue,Expenses,Profit\n";
  monthlyData.forEach(month => {
    const monthName = new Date(month.year, parseInt(month.month) - 1).toLocaleDateString('en-US', { month: 'long' });
    csv += `${monthName},${month.year},${month.revenue},${month.expenses},${month.profit}\n`;
  });
  
  return csv;
}
