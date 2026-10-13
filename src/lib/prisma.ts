import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

function getDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost:5432")) {
    return process.env.DATABASE_URL;
  }
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
      if (match && match[1]) {
        process.env.DATABASE_URL = match[1];
        return match[1];
      }
    }
  } catch {
    // ignore
  }
  return process.env.DATABASE_URL;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  activeUrl: string | undefined;
  dbAvailable: boolean | undefined;
  lastDbCheck: number | undefined;
};

const currentDbUrl = getDatabaseUrl();

function createPrismaClient(url?: string): PrismaClient {
  return new PrismaClient({
    datasources: url ? { db: { url } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma && globalForPrisma.activeUrl === currentDbUrl
    ? globalForPrisma.prisma
    : (() => {
        const client = createPrismaClient(currentDbUrl);
        if (process.env.NODE_ENV !== "production") {
          globalForPrisma.prisma = client;
          globalForPrisma.activeUrl = currentDbUrl;
        }
        return client;
      })();

/**
 * Checks whether PostgreSQL is reachable via Prisma query.
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  const now = Date.now();
  if (
    globalForPrisma.dbAvailable !== undefined &&
    globalForPrisma.lastDbCheck &&
    now - globalForPrisma.lastDbCheck < 30000
  ) {
    return globalForPrisma.dbAvailable;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    globalForPrisma.dbAvailable = true;
    globalForPrisma.lastDbCheck = now;
    return true;
  } catch (err) {
    console.error("Database connection check failed:", err);
    globalForPrisma.dbAvailable = false;
    globalForPrisma.lastDbCheck = now;
    return false;
  }
}

export default prisma;
