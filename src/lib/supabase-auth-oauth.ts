/**
 * Supabase Auth OAuth: production redirectTo so mobile users are sent back to the dashboard after signing in.
 * Use when you call signInWithOAuth (e.g. for Google). Set redirectTo to this value so external/mobile redirects land on the app.
 */
export function getOAuthRedirectTo(): string {
  const base = (typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL)?.replace(/\/$/, "");
  return base ? `${base}/dashboard` : "/dashboard";
}
