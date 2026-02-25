import { Handler } from '@netlify/functions';
import { Resend } from 'resend';

// Your Resend API Key from your Netlify Env Variables
const resend = new Resend(process.env.RESEND_API_KEY);

export const handler: Handler = async (event, context) => {
  try {
    const data = await resend.emails.send({
      from: 'VeloDoc <reports@velodoc.app>', // Ensure domain is verified in Resend
      to: ['jasonlaceyy0638@gmail.com'], // Sending to your admin email
      subject: 'VeloDoc Weekly Sync History (Test)',
      html: `
        <h1>Absolute Precision Reporting</h1>
        <p>This is a test of your automated Monday morning report architecture.</p>
        <p>Attached is the CSV breakdown of last week's QuickBooks syncs.</p>
      `,
      attachments: [
        {
          filename: 'Weekly_Sync_History.csv',
          content: 'Date,Document,Vendor,Amount,Status\n2026-02-23,Invoice_101,OfficeDepot,$150.00,Synced',
        },
      ],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully', id: data.id }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send email' }),
    };
  }
};
