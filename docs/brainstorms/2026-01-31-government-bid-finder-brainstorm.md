---
topic: Government Bid Finder
date: 2026-01-31
status: decided
hackathon: Hack the Stackathon (Firecrawl/Reducto/Resend)
deadline: 6:15 PM today
---

# Government Bid Finder - Brainstorm

## What We're Building

A chat-style interface where contractors describe what they're looking for in natural language, and the system finds matching government bids with AI-powered filtering.

**User flow example:**
> "I'm looking for plumbing and HVAC projects for schools in San Francisco"

System returns matching bids with: title, budget, due date, scope summary extracted from PDF, and option to get email alerts.

## Why This Approach

### Problem Validation
- Existing solutions cost $600-$50,000/year (ConstructConnect, Dodge, BidClerk)
- They're broad but shallow - list bids without parsing PDF content
- Contractors manually check 5+ portals daily
- No trade-specific filtering from actual spec documents

### Hackathon Fit
Judges prioritize:
1. **Real data ingestion** - We scrape live municipal portals
2. **Working systems** - End-to-end flow over polish
3. **Thoughtful tradeoffs** - Two sites deep vs many shallow

### Sponsor Tool Usage
- **Firecrawl**: Scrape bid listing pages, handle JS rendering
- **Reducto**: Parse bid PDFs to extract scope details
- **Resend**: Email alerts when new matching bids appear
- **Tambo**: Dynamic UI for bid result cards

## Key Decisions

### Scope: Two Sites Deep
1. **SFUSD** (sfusd.edu/business-with-sfusd/current-invitations-bids)
   - School district bids
   - Clean HTML structure
   - PDFs with specs, notices, addendums

2. **CaleProcure** (caleprocure.ca.gov/pages/public-search.aspx)
   - California state procurement
   - JS-rendered (Firecrawl handles with `wait` action)
   - Broader scope, more volume

**Why not more sites?** Two working sources proves the pattern. Adding more is config, not code. Less risk during demo.

### User Interface: Chat + Generative UI
- Chat-style input (natural language query)
- Tambo for dynamic bid result cards
- Not a static dashboard - AI interprets what user wants

### Backend: Node.js/TypeScript
- Familiar to builder
- Good async handling for scraping
- Works well with all sponsor SDKs

### Matching Strategy: LLM-Powered
- Parse PDF content with Reducto
- Use LLM to match user query against extracted scope
- More flexible than keyword matching

## Architecture Overview

### Tech Stack
- **Frontend**: Vercel AI SDK + Tambo React SDK
- **Agent**: Tambo agent with custom tools
- **LLM**: OpenRouter (hackathon sponsor track)
- **Scraping**: Firecrawl with JS rendering
- **PDF Parsing**: Reducto `/extract` with structured schema
- **Email**: Resend for alerts
- **Storage**: Tambo thread storage (no separate DB needed)

### Parallel Data Flow (Optimized for Speed)

```
User: "plumbing projects for schools"
         ↓
    ┌────┴────┐
    ↓         ↓
[Scrape     [Scrape          ← PARALLEL (~5 sec total)
 SFUSD]     CaleProcure]
    ↓         ↓
    └────┬────┘
         ↓
Quick filter by title/keywords
         ↓
Top 5-10 potential matches
         ↓
┌────┬────┬────┬────┬────┐
↓    ↓    ↓    ↓    ↓    ↓    ← PARALLEL PDF parsing (~3-5 sec)
[PDF][PDF][PDF][PDF][PDF]
↓    ↓    ↓    ↓    ↓
└────┴────┴────┴────┴────┘
         ↓
OpenRouter LLM ranks matches
         ↓
Tambo renders BidCard components
         ↓
User clicks "Alert me" → Resend email
```

**Total latency: ~10-12 seconds** (vs 50-70 sec serial)

### Reducto Schema for Bid Extraction

```javascript
const bidSchema = {
  type: "object",
  properties: {
    project_title: { type: "string" },
    bid_number: { type: "string" },
    estimated_budget: { type: "string" },
    due_date: { type: "string" },
    scope_summary: { type: "string" },
    trades_required: { type: "array", items: { type: "string" } },
    location: { type: "string" },
    requirements: { type: "array", items: { type: "string" } }
  }
}
```

### Tambo Agent Tools

1. `scrapeBidListings(sources)` → Firecrawl parallel scrape
2. `parseBidPDF(pdfUrl)` → Reducto extract with schema
3. `matchBidsToQuery(query, bids)` → OpenRouter ranking
4. `sendBidAlert(email, bidId)` → Resend email

## What We're NOT Building (Thoughtful Tradeoffs)

- **Not a dashboard** - Chat interface only, no admin panel
- **Not real-time** - On-demand scraping, not continuous polling (can mention "in production this runs every 15 min")
- **Not multi-state** - California only (SF + state level)
- **Not user accounts** - Email capture only, no login system
- **Not bid history** - Fresh scrape each time, no database

## Open Questions (Resolved)

- ~~Can Firecrawl handle CaleProcure JS?~~ Yes, with `wait` action
- ~~Are PDFs accessible without login?~~ Yes, both sites are public
- ~~What trade to demo?~~ User describes in natural language, AI matches

## Demo Script

1. Show the two source sites (real government portals)
2. Type: "Looking for school construction projects involving plumbing"
3. System scrapes live → parses PDFs → shows matching bids with Tambo UI
4. Click "Alert me" on a bid → receive email via Resend
5. Explain: "Adding Oakland or San Jose is config, not code"

## Success Criteria

- [ ] Firecrawl successfully scrapes both sites
- [ ] Reducto parses at least one PDF per site
- [ ] LLM correctly matches query to relevant bids
- [ ] Tambo renders bid cards dynamically
- [ ] Resend sends an alert email
- [ ] Live demo works without mock data
