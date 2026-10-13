import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  createSession,
  attachSessionCookie,
  generateSecureToken,
} from "@/lib/server/auth";
import { sendVerificationEmail } from "@/lib/server/email";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[0-9]|[^a-zA-Z0-9]/, "Password must contain at least one number or special character"),
  confirmPassword: z.string().optional(),
  agreeTerms: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      const errorMsg =
        (result.error as any).issues?.[0]?.message ||
        (result.error as any).errors?.[0]?.message ||
        result.error.message ||
        "Invalid input data";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { name, email, password, confirmPassword } = result.data;

    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const verificationToken = generateSecureToken(32);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Safe transaction: User + Workspace + WorkspaceMember + unconfigured Settings
    const { user, workspace } = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          emailVerified: false,
          verificationToken,
          verificationExpires,
        },
      });

      const newWorkspace = await tx.workspace.create({
        data: {
          name: `${name.trim()}'s Workspace`,
          ownerId: newUser.id,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: newWorkspace.id,
          userId: newUser.id,
          role: "owner",
        },
      });

      // Keep settings unconfigured until user explicitly completes settings
      await tx.settings.create({
        data: {
          id: `settings-${newWorkspace.id}`,
          workspaceId: newWorkspace.id,
          isConfigured: false,
          timezone: "Asia/Kolkata",
          derivedReelsPerLongVideo: 3,
        },
      });

      return { user: newUser, workspace: newWorkspace };
    });

    // Create session
    const session = await createSession(user.id, workspace.id);

    // Send verification email in background
    sendVerificationEmail(user.email, user.name, verificationToken).catch((err) =>
      console.error("Failed sending verification email:", err)
    );

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
        },
        workspace: {
          id: workspace.id,
          name: workspace.name,
        },
      },
      { status: 201 }
    );

    return attachSessionCookie(response, session.token, session.expiresAt);
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create account" },
      { status: 500 }
    );
  }
}
