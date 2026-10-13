import { NextRequest, NextResponse } from "next/server";
import {
  extractTokenFromRequest,
  invalidateSession,
  removeSessionCookie,
} from "@/lib/server/auth";

export async function POST(req: NextRequest) {
  try {
    const token = extractTokenFromRequest(req);
    if (token) {
      await invalidateSession(token);
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    return removeSessionCookie(response);
  } catch (error: any) {
    console.error("Logout error:", error);
    const response = NextResponse.json({ success: true, message: "Logged out" });
    return removeSessionCookie(response);
  }
}
