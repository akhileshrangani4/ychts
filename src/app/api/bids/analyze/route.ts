import { NextRequest, NextResponse } from 'next/server';
import { extractBidFromPDF } from '@/lib/reducto';

export async function POST(request: NextRequest) {
  try {
    const { pdfUrl } = await request.json();

    if (!pdfUrl) {
      return NextResponse.json(
        { error: 'PDF URL is required' },
        { status: 400 }
      );
    }

    const result = await extractBidFromPDF(pdfUrl);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error analyzing PDF:', error);
    return NextResponse.json(
      { error: 'Failed to analyze PDF', details: String(error) },
      { status: 500 }
    );
  }
}
