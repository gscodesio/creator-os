import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "creator_session";
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface AuthContext {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
  };
  workspace: {
    id: string;
    name: string;
    ownerId: string;
  };
  session: {
    id: string;
    token: string;
    expiresAt: Date;
  };
}

/**
 * Hash a plain text password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare plain text password with stored hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate cryptographically secure random hex string
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Create a new active session for user and workspace
 */
export async function createSession(userId: string, workspaceId: string): Promise<{ token: string; expiresAt: Date; id: string }> {
  const token = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  const session = await prisma.session.create({
    data: {
      token,
      userId,
      workspaceId,
      expiresAt,
    },
  });

  return {
    token: session.token,
    expiresAt: session.expiresAt,
    id: session.id,
  };
}

/**
 * Invalidate a single session (e.g. on logout)
 */
export async function invalidateSession(token: string): Promise<void> {
  if (!token) return;
  try {
    await prisma.session.deleteMany({
      where: { token },
    });
  } catch (err) {
    console.error("Error invalidating session:", err);
  }
}

/**
 * Invalidate all active sessions for a user (e.g. after password reset)
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await prisma.session.deleteMany({
      where: { userId },
    });
  } catch (err) {
    console.error("Error invalidating user sessions:", err);
  }
}

/**
 * Extract session token from request cookie or Authorization header
 */
export function extractTokenFromRequest(req: NextRequest | Request): string | null {
  // 1. From NextRequest cookies or standard cookie header
  if ("cookies" in req && typeof req.cookies?.get === "function") {
    const cookie = req.cookies.get(SESSION_COOKIE_NAME);
    if (cookie?.value) return cookie.value;
  }

  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  // 2. From Authorization: Bearer <token>
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  return null;
}

/**
 * Resolve authenticated user, workspace, and session from request
 */
export async function getAuthContext(req: NextRequest | Request): Promise<AuthContext | null> {
  const token = extractTokenFromRequest(req);
  if (!token) {
    return null;
  }

  try {
    const sessionRecord = await prisma.session.findUnique({
      where: { token },
      include: {
        user: true,
        workspace: true,
      },
    });

    if (!sessionRecord) {
      return null;
    }

    // Check expiration
    if (new Date() > sessionRecord.expiresAt) {
      await prisma.session.deleteMany({ where: { token } });
      return null;
    }

    return {
      user: {
        id: sessionRecord.user.id,
        name: sessionRecord.user.name,
        email: sessionRecord.user.email,
        emailVerified: sessionRecord.user.emailVerified,
      },
      workspace: {
        id: sessionRecord.workspace.id,
        name: sessionRecord.workspace.name,
        ownerId: sessionRecord.workspace.ownerId,
      },
      session: {
        id: sessionRecord.id,
        token: sessionRecord.token,
        expiresAt: sessionRecord.expiresAt,
      },
    };
  } catch (error) {
    console.error("Auth context error:", error);
    return null;
  }
}

/**
 * Enforce authentication on a route.
 * Returns AuthContext or throws/returns 401 Response.
 */
export async function requireAuth(req: NextRequest): Promise<{ auth: AuthContext | null; errorResponse: NextResponse | null }> {
  const auth = await getAuthContext(req);
  if (!auth) {
    return {
      auth: null,
      errorResponse: NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 }),
    };
  }
  return { auth, errorResponse: null };
}

/**
 * Attach HTTP-only session cookie to response
 */
export function attachSessionCookie(response: NextResponse, token: string, expiresAt: Date): NextResponse {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return response;
}

/**
 * Clear session cookie from response
 */
export function removeSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}
