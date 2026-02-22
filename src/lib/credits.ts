import { prisma } from "./prisma";

export async function getCredits(userId: string): Promise<number> {
  // Prisma findUnique can fail to match due to encoding when using pooler; fetch all and match in code
  const rows = await prisma.$queryRaw<{ userId: string; credits: number }[]>`
    SELECT "userId", credits FROM "UserCredits"
  `;
  const normalized = userId.trim();
  const row = rows.find((r) => r.userId.trim() === normalized);
  return row?.credits ?? 0;
}

export async function addCredits(userId: string, amount: number): Promise<number> {
  const current = await getCredits(userId);
  const rows = await prisma.$queryRaw<{ id: string; userId: string; credits: number }[]>`
    SELECT id, "userId", credits FROM "UserCredits"
  `;
  const normalized = userId.trim();
  const row = rows.find((r) => r.userId.trim() === normalized);
  if (row) {
    await prisma.$executeRaw`
      UPDATE "UserCredits" SET credits = credits + ${amount}, "updatedAt" = NOW()
      WHERE id = ${row.id}
    `;
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
  const rows = await prisma.$queryRaw<{ id: string; userId: string }[]>`
    SELECT id, "userId" FROM "UserCredits"
  `;
  const normalized = userId.trim();
  const row = rows.find((r) => r.userId.trim() === normalized);
  if (!row) return { ok: false, remaining: 0 };
  await prisma.$executeRaw`
    UPDATE "UserCredits" SET credits = credits - 1, "updatedAt" = NOW()
    WHERE id = ${row.id}
  `;
  return { ok: true, remaining: current - 1 };
}
