import { NextRequest, NextResponse } from "next/server";
import { getContentAssetById, updateContentAsset, deleteContentAsset } from "@/lib/server/contentService";
import { getAuthContext } from "@/lib/server/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const asset = await getContentAssetById(id, auth.workspace.id);
    if (!asset) {
      return NextResponse.json({ error: "Content asset not found" }, { status: 404 });
    }
    return NextResponse.json(asset);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch content asset" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const updated = await updateContentAsset(id, body, auth.workspace.id);
    return NextResponse.json(updated);
  } catch (error: any) {
    const status = error.message?.includes("not found or access denied") ? 404 : 500;
    return NextResponse.json({ error: error.message || "Failed to update content asset" }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deleteContentAsset(id, auth.workspace.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.message?.includes("not found or access denied") ? 404 : 500;
    return NextResponse.json({ error: error.message || "Failed to delete content asset" }, { status });
  }
}
