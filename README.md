# Government Bid Finder

A conversational AI interface for contractors to find and analyze government bid opportunities. Built at Hack the Stackathon @ YC.

## Features

- **Natural Language Search** - Ask for bids in plain English (e.g., "find plumbing projects for schools")
- **Real-time Scraping** - Searches SFUSD and CaleProcure portals using Firecrawl
- **PDF Analysis** - Deep-dive into bid documents with Reducto AI extraction
- **Email Alerts** - Get notified about opportunities via Resend
- **Generative UI** - Dynamic components powered by Tambo

## Tech Stack

- **Frontend**: Next.js 16, React, Tailwind CSS
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

1. **Search for bids** - Type queries like "find electrical projects" or "show me school construction bids"
2. **Select a bid** - Click on any bid card to select it
3. **Analyze details** - Say "analyze this bid" to get a detailed breakdown from the PDF
4. **Get alerts** - Enter your email in the BidDetail card to receive notifications

## Project Structure

```
src/
├── app/
│   ├── api/bids/       # API routes (search, analyze, alert)
│   ├── page.tsx        # Main page
│   └── globals.css     # Styles
├── components/
│   ├── BidCard.tsx     # Individual bid display
│   ├── BidList.tsx     # Bid results with selection
│   ├── BidDetail.tsx   # Detailed bid analysis + email alerts
│   ├── TamboWrapper.tsx
│   └── tambo/          # Tambo UI components
└── lib/
    ├── tambo-config.ts # Tambo components & tools
    ├── firecrawl.ts    # Web scraping
    ├── reducto.ts      # PDF extraction
    └── resend.ts       # Email alerts
```

## API Endpoints

- `POST /api/bids/search` - Search for bids
- `POST /api/bids/analyze` - Analyze a bid PDF
- `POST /api/bids/alert` - Send email alert

## License

MIT
