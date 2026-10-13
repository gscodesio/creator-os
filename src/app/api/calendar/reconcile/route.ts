import { NextResponse } from "next/server";
import { reconcileOverdueCalendar } from "@/lib/server/calendarService";

export async function POST() {
  try {
    const result = await reconcileOverdueCalendar();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to reconcile calendar" }, { status: 500 });
  }
}
