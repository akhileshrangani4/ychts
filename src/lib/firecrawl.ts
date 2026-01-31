import Firecrawl from '@mendable/firecrawl-js';

// Lazy initialization to avoid build-time API key requirement
let firecrawl: Firecrawl | null = null;

function getFirecrawl() {
  if (!firecrawl) {
    firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });
  }
  return firecrawl;
}

// Parse bids from markdown content
function parseBidsFromMarkdown(markdown: string, sourceUrl: string, agency: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bids: any[] = [];

  // Match table rows or list items containing bid info
  // Looking for patterns like "Project Name, Project No. XXXXX" followed by dates
  const lines = markdown.split('\n');

  let currentBid: Record<string, string | string[]> | null = null;

  for (const line of lines) {
    // Look for project patterns in SFUSD format
    const projectMatch = line.match(/([^|]+(?:School|Project|Elementary|High School|Middle School)[^|]*?)(?:,?\s*Project\s*(?:No\.?|#)?\s*:?\s*(\d+))?/i);

    if (projectMatch && (line.includes('Project') || line.includes('School'))) {
      // Save previous bid if exists
      if (currentBid && currentBid.title) {
        bids.push(currentBid);
      }

      // Extract project number
      const projNumMatch = line.match(/Project\s*(?:No\.?|#)?\s*:?\s*(\d+)/i);

      currentBid = {
        title: projectMatch[1].replace(/[-–—]\s*$/, '').trim(),
        bid_number: projNumMatch ? projNumMatch[1] : '',
        agency: agency,
        source_url: sourceUrl,
        trades: [],
        location: 'San Francisco, CA'
      };

      // Look for dates in the same line (table format: | Date Posted | Open Date |)
      const dateMatches = line.match(/(\d{1,2}\/\d{1,2}\/\d{4})/g);
      if (dateMatches && dateMatches.length >= 2) {
        currentBid.due_date = dateMatches[dateMatches.length - 1]; // Last date is usually due date
      }
    }

    // Extract dates from table cells
    if (currentBid) {
      const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{4})/g);
      if (dateMatch && !currentBid.due_date) {
        currentBid.due_date = dateMatch[dateMatch.length - 1];
      }

      // Extract PDF links
      const pdfMatch = line.match(/\[(?:Notice|PDF)[^\]]*\]\((https?:\/\/[^)]+)\)/i);
      if (pdfMatch) {
        currentBid.pdf_url = pdfMatch[1];
      }

      // Detect trades from keywords
      const tradeLower = line.toLowerCase();
      if (tradeLower.includes('plumbing')) (currentBid.trades as string[]).push('Plumbing');
      if (tradeLower.includes('electrical')) (currentBid.trades as string[]).push('Electrical');
      if (tradeLower.includes('hvac')) (currentBid.trades as string[]).push('HVAC');
      if (tradeLower.includes('roofing')) (currentBid.trades as string[]).push('Roofing');
      if (tradeLower.includes('construction')) (currentBid.trades as string[]).push('General Construction');
      if (tradeLower.includes('field')) (currentBid.trades as string[]).push('Field Work');
      if (tradeLower.includes('pa system') || tradeLower.includes('pa upgrade')) (currentBid.trades as string[]).push('Electrical');
      if (tradeLower.includes('green') || tradeLower.includes('landscap')) (currentBid.trades as string[]).push('Landscaping');
    }
  }

  // Don't forget the last bid
  if (currentBid && currentBid.title) {
    bids.push(currentBid);
  }

  // Clean up bids - ensure all fields are strings (not null)
  for (const bid of bids) {
    bid.title = bid.title || 'Untitled Bid';
    bid.bid_number = bid.bid_number || '';
    bid.agency = bid.agency || '';
    bid.due_date = bid.due_date || '';
    bid.estimated_budget = bid.estimated_budget || '';
    bid.location = bid.location || '';
    bid.source_url = bid.source_url || '';
    bid.pdf_url = bid.pdf_url || '';
    bid.trades = bid.trades ? [...new Set(bid.trades as string[])] : [];
  }

  return bids;
}

export async function findBids(userQuery: string) {
  const sources = [
    { url: 'https://www.sfusd.edu/business-with-sfusd/current-invitations-bids', agency: 'San Francisco USD' },
    { url: 'https://caleprocure.ca.gov/pages/public-search.aspx', agency: 'CaleProcure' }
  ];

  // Scrape pages in parallel
  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const scrapeResult = await getFirecrawl().scrape(source.url, {
        formats: ['markdown']
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      return { ...source, markdown: scrapeResult?.markdown || '' };
    })
  );

  // Parse bids from all successful scrapes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allBids: any[] = [];
  const queryLower = userQuery.toLowerCase();

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.markdown) {
      const bids = parseBidsFromMarkdown(
        result.value.markdown,
        result.value.url,
        result.value.agency
      );
      allBids.push(...bids);
    }
  }

  // Filter bids based on query keywords
  const filteredBids = allBids.filter(bid => {
    const bidText = `${bid.title} ${bid.trades?.join(' ') || ''} ${bid.agency}`.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
    return queryWords.some(word => bidText.includes(word)) || queryWords.length === 0;
  });

  return { data: { bids: filteredBids.length > 0 ? filteredBids : allBids } };
}
