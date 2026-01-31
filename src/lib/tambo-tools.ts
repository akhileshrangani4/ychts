'use server';

import { findBids } from './firecrawl';
import { extractBidFromPDF } from './reducto';
import { sendBidAlert } from './resend';

// Tool: Find bids using Firecrawl Agent
export async function searchBids(query: string) {
  try {
    const result = await findBids(query);
    return result;
  } catch (error) {
    console.error('Error finding bids:', error);
    throw error;
  }
}

// Tool: Analyze PDF with Reducto
export async function analyzeBidPDF(pdfUrl: string) {
  try {
    const result = await extractBidFromPDF(pdfUrl);
    return result;
  } catch (error) {
    console.error('Error analyzing PDF:', error);
    throw error;
  }
}

// Tool: Send email alert with Resend
export async function sendAlert(
  email: string,
  bidTitle: string,
  agency: string,
  dueDate: string,
  budget: string,
  url: string
) {
  try {
    const result = await sendBidAlert(email, {
      title: bidTitle,
      agency,
      dueDate,
      estimatedBudget: budget,
      sourceUrl: url
    });
    return { success: true, message: `Alert sent to ${email}`, data: result };
  } catch (error) {
    console.error('Error sending alert:', error);
    throw error;
  }
}
