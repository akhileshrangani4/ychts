import { NextRequest, NextResponse } from 'next/server';
import { findBids } from '@/lib/firecrawl';

// Sanitize bid data to ensure no null values
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeBid(bid: any) {
  return {
    title: bid.title || 'Untitled Bid',
    bid_number: bid.bid_number || '',
    agency: bid.agency || '',
    due_date: bid.due_date || '',
    estimated_budget: bid.estimated_budget || '',
    trades: Array.isArray(bid.trades) ? bid.trades : [],
    location: bid.location || '',
    pdf_url: bid.pdf_url || '',
    source_url: bid.source_url || '',
    // Include coordinates for map display
    latitude: bid.latitude || 37.7749,
    longitude: bid.longitude || -122.4194,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const result = await findBids(query);

    // Sanitize all bids to ensure no null values
    const sanitizedBids = result.data.bids.map(sanitizeBid);

    return NextResponse.json({ data: { bids: sanitizedBids } });
  } catch (error) {
    console.error('Error searching bids:', error);
    return NextResponse.json(
      { error: 'Failed to search bids', details: String(error) },
      { status: 500 }
    );
  }
}
