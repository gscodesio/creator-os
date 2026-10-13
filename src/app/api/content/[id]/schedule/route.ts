import { NextRequest, NextResponse } from "next/server";
import { scheduleContentDistribution } from "@/lib/server/contentService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { platform, date, time } = body;
    if (!platform || !date) {
      return NextResponse.json({ error: "Platform and date are required" }, { status: 400 });
    }
    const updated = await scheduleContentDistribution({
      contentId: id,
      platform,
      date,
      time: time || "10:00 AM",
    });
    const { syncAndPersistEngineTasks } = await import("@/lib/server/taskService");
    await syncAndPersistEngineTasks();
    return NextResponse.json(updated);
  } catch (error: any) {
    const isValidation =
      error.name === "ValidationError" ||
      error.message?.includes("blocked") ||
      error.message?.includes("gap") ||
      error.message?.includes("not found") ||
      error.message?.includes("required") ||
      error.message?.includes("order") ||
      error.message?.includes("restriction") ||
      error.message?.includes("Same-day");
    return NextResponse.json(
      { error: error.message || "Failed to schedule content" },
      { status: isValidation ? 400 : 500 }
    );
  }
}
