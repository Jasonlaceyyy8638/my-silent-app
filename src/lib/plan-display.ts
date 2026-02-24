/**
 * Absolute Precision branding: user-facing plan names.
 * starter -> Starter, pro -> Professional, enterprise -> Enterprise.
 */
export function planDisplayName(plan: string | null | undefined): string {
  const p = (plan ?? "").toLowerCase();
  if (p === "starter") return "Starter";
  if (p === "pro") return "Professional";
  if (p === "enterprise") return "Enterprise";
  return plan ?? "Starter";
}
