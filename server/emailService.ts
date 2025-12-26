import { Resend } from 'resend';

let connectionSettings: any;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

export async function getUncachableResendClient() {
  const credentials = await getCredentials();
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: connectionSettings.settings.from_email
  };
}

export async function sendNotifyMeConfirmation(toEmail: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    await client.emails.send({
      from: fromEmail || 'BroNET <noreply@brointernet.com>',
      to: toEmail,
      subject: "You're on the BroNET launch list!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #7c3aed; margin: 0;">BroNET</h1>
            <p style="color: #666; margin-top: 5px;">Australia's Next-Gen Internet</p>
          </div>
          
          <h2 style="color: #333;">Thanks for signing up!</h2>
          
          <p style="color: #555; line-height: 1.6;">
            You've been added to our launch notification list. We'll send you an email as soon as BroNET is available in your area.
          </p>
          
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); border-radius: 8px; padding: 20px; margin: 25px 0; color: white;">
            <h3 style="margin: 0 0 10px 0;">What to expect:</h3>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Ultra-fast speeds up to 2000 Mbps</li>
              <li>99.9% network uptime</li>
              <li>Aussie-based customer support</li>
              <li>No lock-in contracts</li>
            </ul>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            In the meantime, feel free to check out our plans and coverage information.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://bronet.replit.app/plans" style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Plans</a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} BroNET. All rights reserved.<br />
            You received this email because you signed up for launch notifications.
          </p>
        </div>
      `,
    });
    
    return true;
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    return false;
  }
}

export async function sendAdminNotification(subscriberEmail: string, source: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    await client.emails.send({
      from: fromEmail || 'BroNET <noreply@brointernet.com>',
      to: 'email@brointernet.com',
      subject: `New BroNET Signup: ${subscriberEmail}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7c3aed;">New Email Signup</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">Email:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(subscriberEmail)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Source:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(source)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Time:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}</td>
            </tr>
          </table>
          
          <p style="color: #666; font-size: 14px;">
            This is an automated notification from the BroNET website.
          </p>
        </div>
      `,
    });
    
    return true;
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    return false;
  }
}
