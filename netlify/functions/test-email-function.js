/**
 * test-email-function: Sends the Precision Reporting Monday CSV using SendGrid.
 * Triggers the app's weekly-report API (same flow as cron).
 *
 * Requires: NEXT_PUBLIC_APP_URL (or APP_URL), CRON_SECRET, SENDGRID_API_KEY in Netlify env.
 */
exports.handler = async () => {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "").replace(/\/$/, "");
  const cronSecret = (process.env.CRON_SECRET || "").trim();

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
          error: data.error || "Weekly report request failed",
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
        error: err && err.message ? err.message : "Failed to trigger weekly report",
      }),
    };
  }
};
