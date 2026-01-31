import { Resend } from 'resend';

// Lazy initialization to avoid build-time API key requirement
let resend: Resend | null = null;

function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

interface BidAlertData {
  title: string;
  agency: string;
  dueDate: string;
  estimatedBudget: string;
  sourceUrl: string;
}

export async function sendBidAlert(email: string, bid: BidAlertData) {
  const { data, error } = await getResend().emails.send({
    from: 'Bid Alerts <bidalerts@avi.mn>',
    to: [email],
    subject: `New Bid Match: ${bid.title}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">New Government Bid Opportunity</h1>

          <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 16px 0;">${bid.title}</h2>

            <p style="margin: 8px 0; color: #4a4a4a;">
              <strong>Agency:</strong> ${bid.agency}
            </p>
            <p style="margin: 8px 0; color: #4a4a4a;">
              <strong>Due Date:</strong> ${bid.dueDate}
            </p>
            <p style="margin: 8px 0; color: #4a4a4a;">
              <strong>Estimated Budget:</strong> ${bid.estimatedBudget}
            </p>
          </div>

          <a href="${bid.sourceUrl}" style="
            display: inline-block;
            background-color: #0070f3;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
          ">View Bid Details</a>

          <p style="color: #888; font-size: 12px; margin-top: 30px;">
            You're receiving this because you requested alerts for matching government bids.
          </p>
        </body>
      </html>
    `
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  return data;
}
