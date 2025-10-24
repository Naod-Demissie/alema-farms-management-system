import { NextRequest, NextResponse } from "next/server";
import { checkAndSendVaccinationReminders } from "@/app/(dashboard)/health/server/vaccination-reminders";

// GET endpoint to check and send vaccination reminders
// This can be called by a cron job or scheduled task
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization check here
    // For example, check for an API key in headers
    const apiKey = request.headers.get("x-api-key");
    
    if (process.env.VACCINATION_REMINDER_API_KEY && apiKey !== process.env.VACCINATION_REMINDER_API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check and send reminders
    const result = await checkAndSendVaccinationReminders();

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || "Failed to send reminders" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: `Successfully sent ${result.data?.remindersSent || 0} vaccination reminders`
    });
  } catch (error) {
    console.error("Error in vaccination reminders API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST endpoint as an alternative (can be triggered manually or by external services)
export async function POST(request: NextRequest) {
  return GET(request);
}

