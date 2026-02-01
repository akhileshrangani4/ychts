# Government Bid Finder

A conversational AI interface for contractors to find and analyze government bid opportunities. Built at Hack the Stackathon @ YC.

## Features

- **Interactive Map Search** - Pan/zoom to your service area and search for bids with one click
- **Natural Language Search** - Ask for bids in plain English (e.g., "find plumbing projects for schools")
- **Real-time Scraping** - Searches SFUSD and CaleProcure portals using Firecrawl
- **PDF Analysis** - Deep-dive into bid documents with Reducto AI extraction
- **Email Alerts** - Get notified about opportunities via Resend
- **Generative UI** - Dynamic components powered by Tambo

## Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Maps**: MapLibre GL via mapcn
- **AI/ML**: Tambo (generative UI), OpenRouter (LLM)
- **Data**: Firecrawl (web scraping), Reducto (PDF parsing)
- **Notifications**: Resend (email)

## Getting Started

### Prerequisites

- Node.js 18+
- API keys for: Tambo, Firecrawl, Reducto, Resend

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_TAMBO_API_KEY=your_tambo_key
FIRECRAWL_API_KEY=your_firecrawl_key
REDUCTO_API_KEY=your_reducto_key
RESEND_API_KEY=your_resend_key
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

1. **Search by map** - Pan and zoom the map to your service area, click "Search This Area"
2. **Search by chat** - Type queries like "find electrical projects" or "show me school construction bids"
3. **View on map** - Bid markers appear on the map with clustering for dense areas
4. **Select a bid** - Click on a marker or bid card to select it
5. **Analyze details** - Click "Analyze This Bid" to get a detailed breakdown from the PDF
6. **Get alerts** - Enter your email in the BidDetail card to receive notifications

## Project Structure

```
src/
├── app/
│   ├── api/bids/       # API routes (search, analyze, alert)
│   ├── page.tsx        # Main page
│   └── globals.css     # Styles
├── components/
│   ├── BidMap.tsx      # Interactive map with markers/clustering
│   ├── BidCard.tsx     # Individual bid display
│   ├── BidList.tsx     # Bid results with selection
│   ├── BidDetail.tsx   # Detailed bid analysis + email alerts
│   ├── TamboWrapper.tsx
│   ├── ui/map.tsx      # MapLibre components
│   └── tambo/          # Tambo UI components
└── lib/
    ├── tambo-config.ts # Tambo components & tools
    ├── firecrawl.ts    # Web scraping + geocoding
    ├── reducto.ts      # PDF extraction
    ├── resend.ts       # Email alerts
    └── bid-selection-context.tsx # Global bid/map state
```

## API Endpoints

- `POST /api/bids/search` - Search for bids (returns with lat/lng for map)
- `POST /api/bids/analyze` - Analyze a bid PDF
- `POST /api/bids/alert` - Send email alert

## License

MIT
