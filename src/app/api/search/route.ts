import { NextRequest, NextResponse } from "next/server";
import { searchAllEntities } from "@/lib/server/searchService";
import { getAuthContext } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const results = await searchAllEntities(q, auth.workspace.id);
    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Search failed" }, { status: 500 });
  }
}
