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
      subject: "You're on the list! BroNET is coming soon",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                  
                  <!-- Header with gradient -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%); padding: 40px 30px; text-align: center;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center">
                            <div style="width: 70px; height: 70px; background-color: rgba(255,255,255,0.2); border-radius: 16px; display: inline-block; line-height: 70px; margin-bottom: 15px;">
                              <span style="font-size: 32px;">&#128225;</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td align="center">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">BroNET</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Australia's Next-Gen Internet</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Success badge -->
                  <tr>
                    <td style="padding: 30px 30px 0 30px; text-align: center;">
                      <div style="display: inline-block; background-color: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                        &#10003; You're on the list!
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Main content -->
                  <tr>
                    <td style="padding: 25px 30px;">
                      <h2 style="color: #18181b; margin: 0 0 15px 0; font-size: 22px; font-weight: 600; text-align: center;">Thanks for joining us!</h2>
                      <p style="color: #52525b; line-height: 1.7; margin: 0; font-size: 15px; text-align: center;">
                        You've been added to our exclusive launch notification list. We'll be the first to let you know when BroNET becomes available in your area.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Features grid -->
                  <tr>
                    <td style="padding: 0 30px 25px 30px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #faf5ff; border-radius: 12px; overflow: hidden;">
                        <tr>
                          <td style="padding: 25px;">
                            <p style="color: #7c3aed; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0;">What you'll get</p>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                              <tr>
                                <td width="50%" style="padding: 8px 10px 8px 0; vertical-align: top;">
                                  <table role="presentation" cellspacing="0" cellpadding="0">
                                    <tr>
                                      <td style="background-color: #7c3aed; width: 24px; height: 24px; border-radius: 6px; text-align: center; vertical-align: middle;">
                                        <span style="color: white; font-size: 12px;">&#9889;</span>
                                      </td>
                                      <td style="padding-left: 10px;">
                                        <p style="margin: 0; color: #18181b; font-size: 14px; font-weight: 500;">Up to 2000 Mbps</p>
                                        <p style="margin: 2px 0 0 0; color: #71717a; font-size: 12px;">Ultra-fast speeds</p>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                                <td width="50%" style="padding: 8px 0 8px 10px; vertical-align: top;">
                                  <table role="presentation" cellspacing="0" cellpadding="0">
                                    <tr>
                                      <td style="background-color: #7c3aed; width: 24px; height: 24px; border-radius: 6px; text-align: center; vertical-align: middle;">
                                        <span style="color: white; font-size: 12px;">&#128274;</span>
                                      </td>
                                      <td style="padding-left: 10px;">
                                        <p style="margin: 0; color: #18181b; font-size: 14px; font-weight: 500;">No lock-in</p>
                                        <p style="margin: 2px 0 0 0; color: #71717a; font-size: 12px;">Month-to-month plans</p>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td width="50%" style="padding: 12px 10px 0 0; vertical-align: top;">
                                  <table role="presentation" cellspacing="0" cellpadding="0">
                                    <tr>
                                      <td style="background-color: #7c3aed; width: 24px; height: 24px; border-radius: 6px; text-align: center; vertical-align: middle;">
                                        <span style="color: white; font-size: 12px;">&#127462;&#127482;</span>
                                      </td>
                                      <td style="padding-left: 10px;">
                                        <p style="margin: 0; color: #18181b; font-size: 14px; font-weight: 500;">Aussie support</p>
                                        <p style="margin: 2px 0 0 0; color: #71717a; font-size: 12px;">Local customer care</p>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                                <td width="50%" style="padding: 12px 0 0 10px; vertical-align: top;">
                                  <table role="presentation" cellspacing="0" cellpadding="0">
                                    <tr>
                                      <td style="background-color: #7c3aed; width: 24px; height: 24px; border-radius: 6px; text-align: center; vertical-align: middle;">
                                        <span style="color: white; font-size: 12px;">&#8734;</span>
                                      </td>
                                      <td style="padding-left: 10px;">
                                        <p style="margin: 0; color: #18181b; font-size: 14px; font-weight: 500;">Unlimited data</p>
                                        <p style="margin: 2px 0 0 0; color: #71717a; font-size: 12px;">No caps or throttling</p>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- CTA button -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px; text-align: center;">
                      <a href="https://bronet.replit.app/plans" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);">
                        Preview Our Plans
                      </a>
                      <p style="color: #a1a1aa; font-size: 13px; margin: 15px 0 0 0;">
                        Check out what's coming your way
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #fafafa; padding: 25px 30px; border-top: 1px solid #e4e4e7;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center">
                            <p style="color: #7c3aed; font-weight: 600; font-size: 14px; margin: 0;">BroNET</p>
                            <p style="color: #a1a1aa; font-size: 12px; margin: 8px 0 0 0; line-height: 1.6;">
                              &copy; ${new Date().getFullYear()} BroNET. All rights reserved.<br/>
                              You received this email because you signed up at bronet.replit.app
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
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
