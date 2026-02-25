import { currentUser } from "@clerk/nextjs/server";

/** Hard-coded primary admin; only this email can access /admin and admin APIs. */
const ADMIN_EMAIL_HARDCODED = "jasonlaceyyy8638@gmail.com";

export function getAdminEmail(): string {
  return ADMIN_EMAIL_HARDCODED;
}

/**
 * Returns the current user's primary email (trimmed, lowercase) or null if not signed in.
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  const user = await currentUser();
  const primary =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
  return (primary ?? "").trim() ? (primary ?? "").trim().toLowerCase() : null;
}

/**
 * True if the current user's email matches ADMIN_EMAIL (primary admin).
 */
export async function isAdminUser(): Promise<boolean> {
  const email = await getCurrentUserEmail();
  if (!email) return false;
  return email === getAdminEmail();
}
