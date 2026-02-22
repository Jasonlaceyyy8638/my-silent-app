import { prisma } from "./prisma";

// Raw query rows may have lowercase keys (userid) depending on driver
function getRowUserId(r: Record<string, unknown>): string {
  const u = r.userId ?? r.userid;
  return typeof u === "string" ? u : "";
}
function getRowId(r: Record<string, unknown>): string {
  const i = r.id;
  return typeof i === "string" ? i : "";
}
function getRowCredits(r: Record<string, unknown>): number {
  const c = r.credits;
  return typeof c === "number" ? c : 0;
}

export async function getCredits(userId: string): Promise<number> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT "userId", credits FROM "UserCredits"
  `;
  const normalized = userId.trim();
  const row = rows.find((r) => getRowUserId(r).trim() === normalized);
  return row ? getRowCredits(row) : 0;
}

export async function addCredits(userId: string, amount: number): Promise<number> {
  const current = await getCredits(userId);
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT id, "userId", credits FROM "UserCredits"
  `;
  const normalized = userId.trim();
  const row = rows.find((r) => getRowUserId(r).trim() === normalized);
  if (row) {
    const rowId = getRowId(row);
    await prisma.$executeRaw`UPDATE "UserCredits" SET credits = credits + ${amount}, "updatedAt" = NOW() WHERE id = ${rowId}`;
  } else {
    await prisma.$executeRaw`
      INSERT INTO "UserCredits" (id, "userId", credits, "updatedAt")
      VALUES (gen_random_uuid()::text, ${userId}, ${amount}, NOW())
    `;
  }
  return current + amount;
}

export async function deductCredit(userId: string): Promise<{ ok: boolean; remaining: number }> {
  const current = await getCredits(userId);
  if (current < 1) {
    return { ok: false, remaining: 0 };
  }
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT id, "userId" FROM "UserCredits"
  `;
  const normalized = userId.trim();
  const row = rows.find((r) => getRowUserId(r).trim() === normalized);
  if (!row) return { ok: false, remaining: 0 };
  const rowId = getRowId(row);
  await prisma.$executeRaw`UPDATE "UserCredits" SET credits = credits - 1, "updatedAt" = NOW() WHERE id = ${rowId}`;
  return { ok: true, remaining: current - 1 };
}
