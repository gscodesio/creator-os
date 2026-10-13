import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "creator_session";

export function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const path = req.nextUrl.pathname;

  // Private routes that require authentication
  const isProtected = [
    "/dashboard",
    "/topics",
    "/content",
    "/tasks",
    "/calendar",
    "/settings",
    "/analytics",
    "/media",
  ].some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

  if (isProtected && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  }

  // Prevent authenticated users from visiting login or signup unnecessarily
  if ((path === "/login" || path === "/signup") && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/topics/:path*",
    "/content/:path*",
    "/tasks/:path*",
    "/calendar/:path*",
    "/settings/:path*",
    "/analytics/:path*",
    "/media/:path*",
    "/login",
    "/signup",
  ],
};
