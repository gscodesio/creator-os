import { NextRequest, NextResponse } from "next/server";
import { getTopicById, updateTopic, deleteTopic } from "@/lib/server/topicService";
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
    const topic = await getTopicById(id, auth.workspace.id);
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }
    return NextResponse.json(topic);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch topic" }, { status: 500 });
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
    const updated = await updateTopic(id, body, auth.workspace.id);
    return NextResponse.json(updated);
  } catch (error: any) {
    const status = error.message?.includes("not found or access denied") ? 404 : 500;
    return NextResponse.json({ error: error.message || "Failed to update topic" }, { status });
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
    await deleteTopic(id, auth.workspace.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.message?.includes("not found or access denied") ? 404 : 500;
    return NextResponse.json({ error: error.message || "Failed to delete topic" }, { status });
  }
}
