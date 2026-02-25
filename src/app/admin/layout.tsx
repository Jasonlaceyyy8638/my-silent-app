import { redirect } from "next/navigation";
import { isAdminUser } from "@/lib/admin-auth";

/**
 * Server-side security check: only the primary admin (ADMIN_EMAIL) can access /admin.
 * Middleware already requires auth for /admin; this layout redirects non-admin users to home immediately.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allowed = await isAdminUser();
  if (!allowed) redirect("/");
  return <>{children}</>;
}
