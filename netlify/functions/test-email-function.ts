import { Handler } from "@netlify/functions";

/**
 * test-email-function: Sends the Precision Reporting Monday CSV using SendGrid.
 * Triggers the same weekly-report flow as the cron (fetches synced docs, builds CSV, sends via SendGrid).
 *
 * Invoke: Netlify dashboard → Functions → test-email-function → Run
 * Or: npx netlify functions:invoke test-email-function
 *
 * Requires in Netlify env:
 * - SENDGRID_API_KEY (used by the app when weekly-report runs)
 * - CRON_SECRET
 * - NEXT_PUBLIC_APP_URL or APP_URL (e.g. https://your-site.netlify.app)
 */
export const handler: Handler = async () => {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "").replace(/\/$/, "");
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!appUrl || !cronSecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: "NEXT_PUBLIC_APP_URL (or APP_URL) and CRON_SECRET must be set in Netlify env",
      }),
    };
  }

  try {
    const res = await fetch(`${appUrl}/api/cron/weekly-report`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({
          ok: false,
          error: (data as { error?: string }).error ?? "Weekly report request failed",
          status: res.status,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        message: "Precision Reporting Monday CSV sent via SendGrid",
        ...data,
      }),
    };
  } catch (err) {
    console.error("test-email-function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : "Failed to trigger weekly report",
      }),
    };
  }
};
