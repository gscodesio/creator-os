import { NextRequest, NextResponse } from "next/server";
import { getCalendarEvents } from "@/lib/server/calendarService";
import { getAuthContext } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const events = await getCalendarEvents(auth.workspace.id);
    return NextResponse.json(events);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch calendar events" }, { status: 500 });
  }
}
