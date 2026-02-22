import { prisma } from "./prisma";

export async function getCredits(userId: string): Promise<number> {
  const row = await prisma.userCredits.findUnique({
    where: { userId },
  });
  return row?.credits ?? 0;
}

export async function addCredits(userId: string, amount: number): Promise<number> {
  const updated = await prisma.userCredits.upsert({
    where: { userId },
    create: { userId, credits: amount },
    update: { credits: { increment: amount } },
  });
  return updated.credits;
}

export async function deductCredit(userId: string): Promise<{ ok: boolean; remaining: number }> {
  const row = await prisma.userCredits.findUnique({
    where: { userId },
  });
  const current = row?.credits ?? 0;
  if (current < 1) {
    return { ok: false, remaining: 0 };
  }
  const updated = await prisma.userCredits.update({
    where: { userId },
    data: { credits: { decrement: 1 } },
  });
  return { ok: true, remaining: updated.credits };
}
