import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

let currentTestCookie = null;
let currentTestUserId = null;
let isInterceptorActive = false;

/**
 * Initializes an authenticated test session and patches globalThis.fetch
 * so that all requests to the local dev server carry the valid session cookie.
 */
export async function setupTestAuth(baseUrl = "http://localhost:3000", tag = "runner") {
  const email = `test-${tag}-${Date.now()}@creatoros.app`;
  const password = "TestPassword123!";

  const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `Test ${tag}`,
      email,
      password,
    }),
  });

  const cookie = signupRes.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) {
    throw new Error(`Failed to initialize test auth: ${signupRes.status} ${await signupRes.text()}`);
  }

  const data = await signupRes.json();
  currentTestCookie = cookie;
  currentTestUserId = data.user?.id;

  if (!isInterceptorActive) {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options = {}) => {
      const urlStr = typeof url === "string" ? url : url.toString();
      if (urlStr.includes("localhost:3000") || urlStr.includes("127.0.0.1:3000")) {
        const headers = new Headers(options.headers || {});
        if (!headers.has("Cookie") && currentTestCookie) {
          headers.set("Cookie", currentTestCookie);
        }
        return originalFetch(url, { ...options, headers });
      }
      return originalFetch(url, options);
    };
    isInterceptorActive = true;
  }

  return { cookie, userId: currentTestUserId, email };
}

/**
 * Clean up test user and its workspace
 */
export async function teardownTestAuth() {
  if (currentTestUserId) {
    try {
      const member = await prisma.workspaceMember.findFirst({
        where: { userId: currentTestUserId },
      });
      if (member) {
        const workspaceId = member.workspaceId;
        await prisma.platformDistribution.deleteMany({
          where: { contentAsset: { workspaceId } },
        });
        await prisma.task.deleteMany({ where: { workspaceId } });
        await prisma.mediaAsset.deleteMany({ where: { workspaceId } });
        await prisma.topic.deleteMany({ where: { workspaceId } });
        await prisma.contentAsset.deleteMany({ where: { workspaceId } });
        await prisma.settings.deleteMany({ where: { workspaceId } });
        await prisma.workspaceMember.deleteMany({ where: { workspaceId } });
        await prisma.workspace.deleteMany({ where: { id: workspaceId } });
      }
      await prisma.session.deleteMany({ where: { userId: currentTestUserId } });
      await prisma.user.deleteMany({ where: { id: currentTestUserId } });
    } catch (err) {
      console.error("Error in teardownTestAuth:", err);
    } finally {
      await prisma.$disconnect();
    }
  }
}
