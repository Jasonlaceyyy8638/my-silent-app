import { prisma } from "./prisma";

const norm = (s: string) => s.trim().toLowerCase();

/** Canonical form for comparison (avoids 0/O and 1/l/i confusion from encoding). */
const canonical = (s: string) =>
  norm(s).replace(/o/g, "0").replace(/[li]/g, "1");

function matchUserId(rowUserId: string, currentUserId: string): boolean {
  if (norm(rowUserId) === norm(currentUserId)) return true;
  return canonical(rowUserId) === canonical(currentUserId);
}

export async function getCredits(userId: string): Promise<number> {
  const all = await prisma.userCredits.findMany();
  const row = all.find((r) => matchUserId(r.userId, userId));
  return row?.credits ?? 0;
}

const WELCOME_CREDITS = 5;

/** Ensures the user has a credits row; if they don't (new account), creates one with 5 free credits. Returns their current credit balance. */
export async function ensureWelcomeCredits(userId: string): Promise<number> {
  const all = await prisma.userCredits.findMany();
  const row = all.find((r) => matchUserId(r.userId, userId));
  if (row) return row.credits;
  await prisma.userCredits.create({
    data: { userId, credits: WELCOME_CREDITS },
  });
  return WELCOME_CREDITS;
}

export async function addCredits(userId: string, amount: number): Promise<number> {
  const current = await getCredits(userId);
  const all = await prisma.userCredits.findMany();
  const row = all.find((r) => matchUserId(r.userId, userId));
  if (row) {
    await prisma.userCredits.update({
      where: { id: row.id },
      data: { credits: { increment: amount } },
    });
  } else {
    await prisma.userCredits.create({
      data: { userId, credits: amount },
    });
  }
  return current + amount;
}

export async function deductCredit(userId: string): Promise<{ ok: boolean; remaining: number }> {
  const current = await getCredits(userId);
  if (current < 1) return { ok: false, remaining: 0 };
  const all = await prisma.userCredits.findMany();
  const row = all.find((r) => matchUserId(r.userId, userId));
  if (!row) return { ok: false, remaining: 0 };
  const updated = await prisma.userCredits.update({
    where: { id: row.id },
    data: { credits: { decrement: 1 } },
  });
  return { ok: true, remaining: updated.credits };
}
