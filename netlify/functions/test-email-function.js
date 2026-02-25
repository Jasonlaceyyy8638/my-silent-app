const { Resend } = require("resend");

/**
 * Netlify serverless function: test-email-function
 * Invoke via: npx netlify functions:invoke test-email-function
 * Or from Netlify dashboard: Functions → test-email-function → Run
 *
 * Requires RESEND_API_KEY in Netlify env. Optional: TEST_EMAIL_TO (defaults to admin).
 */
exports.handler = async () => {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: "RESEND_API_KEY is not set in environment",
      }),
    };
  }

  const to = process.env.TEST_EMAIL_TO?.trim() || "admin@velodoc.app";
  const from = process.env.SUPPORT_FROM_EMAIL || "support@velodoc.app";

  try {
    const resend = new Resend(resendKey);
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: "VeloDoc test email (Netlify function)",
      text: "This is a test email from the test-email-function on Netlify. If you received this, the function and Resend are working.",
      html: `
        <p>This is a test email from the <strong>test-email-function</strong> on Netlify.</p>
        <p>If you received this, the function and Resend are working.</p>
        <p><em>Sent at ${new Date().toISOString()}</em></p>
      `,
    });

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ ok: false, error: error.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        message: "Test email sent",
        id: data?.id,
        to,
      }),
    };
  } catch (err) {
    console.error("test-email-function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: err.message || "Failed to send test email",
      }),
    };
  }
};
