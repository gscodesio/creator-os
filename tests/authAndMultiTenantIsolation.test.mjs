import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const prisma = new PrismaClient();

const USER_ALICE = {
  name: "Alice Creator",
  email: `alice_${Date.now()}@example.com`,
  password: "Password123!",
};

const USER_BOB = {
  name: "Bob Creator",
  email: `bob_${Date.now()}@example.com`,
  password: "SecurePass456#",
};

let aliceCookie = "";
let bobCookie = "";
let aliceTopicId = "";
let aliceContentId = "";
let aliceTaskId = "";

describe("Authentication & Multi-Tenant Workspace Isolation Suite", { concurrency: 1 }, () => {
  after(async () => {
    // Clean up test users
    await prisma.$transaction(async (tx) => {
      const users = await tx.user.findMany({
        where: { email: { in: [USER_ALICE.email, USER_BOB.email] } },
        include: { workspaces: true },
      });

      for (const u of users) {
        for (const wm of u.workspaces) {
          await tx.platformDistribution.deleteMany({
            where: { contentAsset: { workspaceId: wm.workspaceId } },
          });
          await tx.task.deleteMany({ where: { workspaceId: wm.workspaceId } });
          await tx.mediaAsset.deleteMany({ where: { workspaceId: wm.workspaceId } });
          await tx.topic.updateMany({
            where: { workspaceId: wm.workspaceId },
            data: { contentAssetId: null },
          });
          await tx.topic.deleteMany({ where: { workspaceId: wm.workspaceId } });
          await tx.contentAsset.deleteMany({ where: { workspaceId: wm.workspaceId } });
          await tx.settings.deleteMany({ where: { workspaceId: wm.workspaceId } });
          await tx.session.deleteMany({ where: { workspaceId: wm.workspaceId } });
          await tx.workspaceMember.deleteMany({ where: { workspaceId: wm.workspaceId } });
          await tx.workspace.deleteMany({ where: { id: wm.workspaceId } });
        }
        await tx.user.delete({ where: { id: u.id } });
      }
    });

    await prisma.$disconnect();
  });

  // --------------------------------------------------------------------------
  // 1. SIGNUP VALIDATION & ACCOUNT CREATION
  // --------------------------------------------------------------------------
  test("Signup validation: Missing name rejected", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "",
        email: "test@example.com",
        password: "ValidPass123!",
      }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /name/i);
  });

  test("Signup validation: Invalid email rejected", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "invalid-email-format",
        password: "ValidPass123!",
      }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /valid email/i);
  });

  test("Signup validation: Weak password rejected", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "weak@example.com",
        password: "weak",
      }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /8 characters/i);
  });

  test("Signup validation: Password confirmation mismatch rejected", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "mismatch@example.com",
        password: "ValidPass123!",
        confirmPassword: "DifferentPass456!",
      }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /do not match/i);
  });

  test("Valid Signup: Alice registers successfully and receives session cookie", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: USER_ALICE.name,
        email: USER_ALICE.email,
        password: USER_ALICE.password,
        confirmPassword: USER_ALICE.password,
        agreeTerms: true,
      }),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.name, USER_ALICE.name);
    assert.equal(data.user.email, USER_ALICE.email);
    assert.ok(data.workspace.id);

    // Cookie set in response headers
    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie, "Session cookie must be set on successful signup");
    assert.match(setCookie, /creator_session=/);
    aliceCookie = setCookie.split(";")[0];
  });

  test("Signup duplicate email rejection: Alice cannot register again with same email", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alice Impersonator",
        email: USER_ALICE.email.toUpperCase(), // Case insensitive check
        password: "SomePassword123!",
      }),
    });
    assert.equal(res.status, 409);
    const data = await res.json();
    assert.match(data.error, /already exists/i);
  });

  test("Valid Signup: Bob registers successfully as second independent user", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: USER_BOB.name,
        email: USER_BOB.email,
        password: USER_BOB.password,
        confirmPassword: USER_BOB.password,
        agreeTerms: true,
      }),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.workspace.id);

    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie);
    bobCookie = setCookie.split(";")[0];
  });

  // --------------------------------------------------------------------------
  // 2. LOGIN & AUTHENTICATION FEEDBACK
  // --------------------------------------------------------------------------
  test("Login validation: Invalid credentials rejected", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: USER_ALICE.email,
        password: "WrongPassword999!",
      }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.match(data.error, /invalid email or password/i);
  });

  test("Login: Alice authenticates with valid credentials", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: USER_ALICE.email,
        password: USER_ALICE.password,
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.email, USER_ALICE.email);

    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie);
    aliceCookie = setCookie.split(";")[0];
  });

  test("Session check: /api/auth/me resolves authenticated user and workspace", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: aliceCookie },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.authenticated, true);
    assert.equal(data.user.email, USER_ALICE.email);
    assert.ok(data.workspace.id);
  });

  test("Protected API rejection: Unauthenticated requests return 401", async () => {
    const res = await fetch(`${BASE_URL}/api/topics`);
    assert.equal(res.status, 401, "Unauthenticated request to /api/topics must be 401");
  });

  // --------------------------------------------------------------------------
  // 3. MULTI-TENANT WORKSPACE ISOLATION TESTS
  // --------------------------------------------------------------------------
  test("Isolation: Initial accounts have empty collections and unconfigured settings", async () => {
    // Check Alice settings
    const aliceSettingsRes = await fetch(`${BASE_URL}/api/settings`, {
      headers: { Cookie: aliceCookie },
    });
    assert.equal(aliceSettingsRes.status, 200);
    const aliceSettings = await aliceSettingsRes.json();
    assert.equal(aliceSettings.isConfigured, false);

    // Check Bob settings
    const bobSettingsRes = await fetch(`${BASE_URL}/api/settings`, {
      headers: { Cookie: bobCookie },
    });
    assert.equal(bobSettingsRes.status, 200);
    const bobSettings = await bobSettingsRes.json();
    assert.equal(bobSettings.isConfigured, false);

    // Check Bob has 0 topics
    const bobTopicsRes = await fetch(`${BASE_URL}/api/topics`, {
      headers: { Cookie: bobCookie },
    });
    assert.equal(bobTopicsRes.status, 200);
    const bobTopics = await bobTopicsRes.json();
    assert.equal(bobTopics.topics.length, 0);
  });

  test("Isolation: Alice creates a Topic in her workspace", async () => {
    const res = await fetch(`${BASE_URL}/api/topics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: aliceCookie,
      },
      body: JSON.stringify({
        title: "Alice Private Microservices Guide",
        type: "YouTube Long",
        status: "idea",
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.id);
    aliceTopicId = data.id;
  });

  test("Isolation: Bob cannot see Alice's Topic in topics list", async () => {
    const res = await fetch(`${BASE_URL}/api/topics`, {
      headers: { Cookie: bobCookie },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    const found = data.topics.find((t) => t.id === aliceTopicId);
    assert.equal(found, undefined, "Bob must not see Alice's topic in /api/topics");
  });

  test("Isolation: Bob cannot fetch Alice's Topic by ID (404/403)", async () => {
    const res = await fetch(`${BASE_URL}/api/topics/${aliceTopicId}`, {
      headers: { Cookie: bobCookie },
    });
    assert.equal(res.status, 404, "Bob accessing Alice's topic ID must return 404");
  });

  test("Isolation: Bob cannot update or delete Alice's Topic", async () => {
    const patchRes = await fetch(`${BASE_URL}/api/topics/${aliceTopicId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: bobCookie,
      },
      body: JSON.stringify({ title: "Hacked by Bob" }),
    });
    assert.equal(patchRes.status, 404, "Bob cannot patch Alice's topic");

    const delRes = await fetch(`${BASE_URL}/api/topics/${aliceTopicId}`, {
      method: "DELETE",
      headers: { Cookie: bobCookie },
    });
    assert.equal(delRes.status, 404, "Bob cannot delete Alice's topic");
  });

  test("Isolation: Alice starts production; Content Asset and tasks stay in Alice's workspace", async () => {
    const startProdRes = await fetch(`${BASE_URL}/api/topics/${aliceTopicId}/start-production`, {
      method: "POST",
      headers: { Cookie: aliceCookie },
    });
    assert.equal(startProdRes.status, 200);
    const data = await startProdRes.json();
    assert.equal(data.success, true);
    assert.ok(data.asset);
    aliceContentId = data.asset.id;

    // Bob cannot see Alice's Content Asset in /api/content
    const bobContentRes = await fetch(`${BASE_URL}/api/content`, {
      headers: { Cookie: bobCookie },
    });
    assert.equal(bobContentRes.status, 200);
    const bobContentData = await bobContentRes.json();
    const foundAsset = bobContentData.assets.find((a) => a.id === aliceContentId);
    assert.equal(foundAsset, undefined, "Bob must not see Alice's content asset");

    // Bob cannot fetch Alice's Content Asset by ID
    const bobAssetDetail = await fetch(`${BASE_URL}/api/content/${aliceContentId}`, {
      headers: { Cookie: bobCookie },
    });
    assert.equal(bobAssetDetail.status, 404);
  });

  test("Isolation: Bob search query does not return Alice's topics or content", async () => {
    const searchRes = await fetch(`${BASE_URL}/api/search?q=Microservices`, {
      headers: { Cookie: bobCookie },
    });
    assert.equal(searchRes.status, 200);
    const searchData = await searchRes.json();
    const foundAlice = searchData.results.find((r) => r.id === aliceTopicId || r.id === aliceContentId);
    assert.equal(foundAlice, undefined, "Search must be isolated to user's workspace");
  });

  // --------------------------------------------------------------------------
  // 4. PASSWORD RECOVERY & EMAIL VERIFICATION
  // --------------------------------------------------------------------------
  test("Password recovery: Dispatches generic response without email enumeration", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: USER_ALICE.email }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.match(data.message, /password reset link/i);

    // Non-existent email returns same generic success message
    const nonExistentRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nonexistent_creator_999@example.com" }),
    });
    assert.equal(nonExistentRes.status, 200);
  });

  test("Password reset: Single-use token resets password and revokes previous sessions", async () => {
    // Read the generated token from Alice's user record in Neon
    const userInDb = await prisma.user.findUnique({
      where: { email: USER_ALICE.email },
    });
    assert.ok(userInDb?.resetPasswordToken, "Reset token must be generated in DB");

    const newPassword = "BrandNewPassword2026!";

    // Reset password with valid token
    const resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: userInDb.resetPasswordToken,
        password: newPassword,
        confirmPassword: newPassword,
      }),
    });
    assert.equal(resetRes.status, 200);
    const resetData = await resetRes.json();
    assert.equal(resetData.success, true);

    // Old cookie should now be invalidated
    const oldSessionCheck = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: aliceCookie },
    });
    assert.equal(oldSessionCheck.status, 401, "Old sessions must be revoked after password reset");

    // Login with new password succeeds
    const loginNewRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: USER_ALICE.email,
        password: newPassword,
      }),
    });
    assert.equal(loginNewRes.status, 200);
    const newCookie = loginNewRes.headers.get("set-cookie")?.split(";")[0];
    assert.ok(newCookie);
    aliceCookie = newCookie;

    // Token is single-use: repeating with same token fails
    const reusedReset = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: userInDb.resetPasswordToken,
        password: "AnotherPassword123!",
      }),
    });
    assert.equal(reusedReset.status, 400, "Reset token must be single-use only");
  });

  test("Email verification: Valid token marks email as verified", async () => {
    const userInDb = await prisma.user.findUnique({
      where: { email: USER_BOB.email },
    });
    assert.ok(userInDb?.verificationToken);

    const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: userInDb.verificationToken }),
    });
    assert.equal(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.equal(verifyData.success, true);

    const updatedBob = await prisma.user.findUnique({
      where: { email: USER_BOB.email },
    });
    assert.equal(updatedBob?.emailVerified, true);
  });

  test("Logout: Invalidate session and clear access to protected operations", async () => {
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: aliceCookie },
    });
    assert.equal(logoutRes.status, 200);

    // Accessing private API with logged-out cookie returns 401
    const privateCheck = await fetch(`${BASE_URL}/api/topics`, {
      headers: { Cookie: aliceCookie },
    });
    assert.equal(privateCheck.status, 401, "Logged out user must receive 401 on private APIs");
  });
});
