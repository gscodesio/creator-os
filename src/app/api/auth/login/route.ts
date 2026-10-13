import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  comparePassword,
  createSession,
  attachSessionCookie,
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION_MS,
} from "@/lib/server/auth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      const errorMsg =
        (result.error as any).issues?.[0]?.message ||
        (result.error as any).errors?.[0]?.message ||
        result.error.message ||
        "Invalid credentials";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        workspaces: {
          include: {
            workspace: true,
          },
        },
      },
    });

    // Check account lockout protection
    if (user?.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        {
          error: `Account is temporarily locked due to repeated failed logins. Please try again in ${minutesLeft} minute(s).`,
        },
        { status: 429 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);

    if (!isMatch) {
      const attempts = user.failedLoginAttempts + 1;
      const isLockout = attempts >= MAX_LOGIN_ATTEMPTS;
      const lockoutUntil = isLockout ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockoutUntil,
        },
      });

      if (isLockout) {
        return NextResponse.json(
          {
            error: "Too many failed attempts. Account has been locked for 15 minutes.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockoutUntil: null,
        },
      });
    }

    // Resolve user's workspace
    let activeWorkspace = user.workspaces[0]?.workspace;

    if (!activeWorkspace) {
      // Self-heal workspace if missing
      activeWorkspace = await prisma.workspace.create({
        data: {
          name: `${user.name}'s Workspace`,
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: "owner",
            },
          },
          settings: {
            create: {
              isConfigured: false,
              timezone: "Asia/Kolkata",
            },
          },
        },
      });
    }

    const session = await createSession(user.id, activeWorkspace.id);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
      },
      workspace: {
        id: activeWorkspace.id,
        name: activeWorkspace.name,
      },
    });

    return attachSessionCookie(response, session.token, session.expiresAt);
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to log in" },
      { status: 500 }
    );
  }
}
