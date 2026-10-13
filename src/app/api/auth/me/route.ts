import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: auth.user,
      workspace: auth.workspace,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to check session" }, { status: 500 });
  }
}
