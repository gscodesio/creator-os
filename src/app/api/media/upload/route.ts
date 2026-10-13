import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/server/auth";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const contentAssetId = (formData.get("contentAssetId") as string) || null;
    const purpose = (formData.get("purpose") as string) || "thumbnail";

    if (!file) {
      return NextResponse.json({ error: "No media file provided in upload request" }, { status: 400 });
    }

    // If contentAssetId provided, verify it belongs to this workspace
    if (contentAssetId) {
      const asset = await prisma.contentAsset.findFirst({
        where: { id: contentAssetId, workspaceId: auth.workspace.id },
      });
      if (!asset) {
        return NextResponse.json({ error: "Content asset not found or access denied" }, { status: 404 });
      }
    }

    const mimeType = file.type.toLowerCase();
    const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(mimeType);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          error: `Unsupported file type "${file.type}". Allowed formats: JPEG, PNG, WEBP, GIF, MP4, WEBM, MOV.`,
        },
        { status: 400 }
      );
    }

    if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Image file exceeds maximum allowed size of 15MB (file size: ${(file.size / (1024 * 1024)).toFixed(1)}MB)` },
        { status: 400 }
      );
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Video file exceeds maximum allowed size of 100MB (file size: ${(file.size / (1024 * 1024)).toFixed(1)}MB)` },
        { status: 400 }
      );
    }

    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        {
          error: "Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured on the server.",
        },
        { status: 500 }
      );
    }

    // Convert file to base64 Data URI
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = `data:${file.type};base64,${buffer.toString("base64")}`;

    const resourceType = isVideo ? "video" : "image";
    const uploaded = await uploadToCloudinary(base64Data, {
      folder: "creator-os",
      resource_type: resourceType,
    });

    // Persist Cloudinary metadata directly in PostgreSQL through Prisma
    let mediaRecord = null;
    try {
      mediaRecord = await prisma.mediaAsset.create({
        data: {
          workspaceId: auth.workspace.id,
          contentAssetId: contentAssetId || null,
          publicId: uploaded.public_id,
          secureUrl: uploaded.secure_url,
          resourceType: uploaded.resource_type,
          format: uploaded.format,
          bytes: uploaded.bytes,
          width: uploaded.width || null,
          height: uploaded.height || null,
          duration: uploaded.duration || null,
          purpose,
          originalFilename: file.name,
        },
      });

      // If tied to content asset, update drive asset status or thumbnail
      if (contentAssetId) {
        await prisma.contentAsset.update({
          where: { id: contentAssetId },
          data: {
            driveAsset: "Added",
            lastUpdated: "Today",
          },
        });
      }
    } catch (dbErr: any) {
      console.error("Failed to persist media asset record in database:", dbErr);
    }

    return NextResponse.json({
      success: true,
      public_id: uploaded.public_id,
      secure_url: uploaded.secure_url,
      resource_type: uploaded.resource_type,
      format: uploaded.format,
      bytes: uploaded.bytes,
      width: uploaded.width,
      height: uploaded.height,
      duration: uploaded.duration,
      original_filename: file.name,
      mediaRecord,
    });
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload media to Cloudinary" },
      { status: 500 }
    );
  }
}
