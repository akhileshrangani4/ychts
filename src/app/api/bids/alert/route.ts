import { NextRequest, NextResponse } from 'next/server';
import { sendBidAlert } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const { email, bidTitle, agency, dueDate, budget, url } = await request.json();

    if (!email || !bidTitle) {
      return NextResponse.json(
        { error: 'Email and bid title are required' },
        { status: 400 }
      );
    }

    const result = await sendBidAlert(email, {
      title: bidTitle,
      agency: agency || 'Unknown Agency',
      dueDate: dueDate || 'Not specified',
      estimatedBudget: budget || 'Not specified',
      sourceUrl: url || '#',
    });

    return NextResponse.json({
      success: true,
      message: `Alert sent to ${email}`,
      data: result,
    });
  } catch (error) {
    console.error('Error sending alert:', error);
    return NextResponse.json(
      { error: 'Failed to send alert', details: String(error) },
      { status: 500 }
    );
  }
}
