---
title: "feat: Government Bid Finder"
type: feat
date: 2026-01-31
hackathon: Hack the Stackathon
deadline: 6:15 PM today
---

# Government Bid Finder

Chat interface for contractors to find matching government bids using natural language.

## Tech Stack

- **Frontend**: Next.js + Tambo React SDK
- **Core Intelligence**: Firecrawl Agent (autonomous search + extract)
- **PDF Deep-Dive**: Reducto `/extract` (for detailed PDF analysis)
- **Email**: Resend
- **Storage**: Tambo thread storage (no DB needed)

> **Note**: No separate LLM needed - Firecrawl Agent (Spark 1 Pro) handles search, navigation, and intelligent extraction.

## Target Sites

1. `https://www.sfusd.edu/business-with-sfusd/current-invitations-bids` (SFUSD)
2. `https://caleprocure.ca.gov/pages/public-search.aspx` (CaleProcure - JS rendered)

## Implementation Phases

### Phase 1: Project Setup (~30 min)

```bash
# 1. Initialize Next.js
npx create-next-app@latest . --typescript --tailwind --app --src-dir

# 2. Install dependencies
npm install @tambo-ai/react @mendable/firecrawl-js resend zod

# 3. Create .env.local
```

**Files to create:**

```
.env.local
```

```env
FIRECRAWL_API_KEY=fc-xxx
REDUCTO_API_KEY=xxx
RESEND_API_KEY=re_xxx
OPENROUTER_API_KEY=xxx
NEXT_PUBLIC_TAMBO_API_KEY=xxx
```

### Phase 2: Core Types & Schema (~15 min)

**File: `src/types/bid.ts`**

```typescript
export interface Bid {
  id: string;
  source: 'sfusd' | 'caleprocure';
  title: string;
  bidNumber: string;
  agency: string;
  estimatedBudget: string;
  dueDate: string;
  postedDate: string;
  scopeSummary: string;
  tradesRequired: string[];
  location: string;
  pdfUrl?: string;
  sourceUrl: string;
}

export interface BidSearchResult {
  bids: Bid[];
  query: string;
  sources: string[];
}
```

**File: `src/lib/schemas.ts`**

```typescript
import { z } from 'zod';

// Reducto extraction schema
export const bidExtractionSchema = {
  type: 'object',
  properties: {
    project_title: { type: 'string', description: 'Name of the project' },
    bid_number: { type: 'string', description: 'Official bid/project number' },
    estimated_budget: { type: 'string', description: 'Budget or cost estimate' },
    due_date: { type: 'string', description: 'Bid submission deadline' },
    scope_summary: { type: 'string', description: 'Brief summary of work required' },
    trades_required: {
      type: 'array',
      items: { type: 'string' },
      description: 'Construction trades needed (plumbing, electrical, HVAC, etc.)'
    },
    location: { type: 'string', description: 'Project location/address' }
  }
};

// Zod schemas for Tambo tools
export const searchBidsInputSchema = z.object({
  query: z.string().describe('Natural language search query'),
  sources: z.array(z.enum(['sfusd', 'caleprocure'])).optional()
    .describe('Which sources to search')
});

export const sendAlertInputSchema = z.object({
  email: z.string().email().describe('Email address for alerts'),
  bidId: z.string().describe('ID of the bid to track')
});
```

### Phase 3: API Services (~45 min)

**File: `src/lib/firecrawl.ts`**

```typescript
import Firecrawl from '@mendable/firecrawl-js';

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });

// Bid schema for structured extraction
const bidSchema = {
  type: "object",
  properties: {
    bids: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Project/bid title" },
          bid_number: { type: "string", description: "Official bid number" },
          agency: { type: "string", description: "Government agency name" },
          due_date: { type: "string", description: "Submission deadline" },
          estimated_budget: { type: "string", description: "Budget estimate" },
          trades: { type: "array", items: { type: "string" }, description: "Required trades (plumbing, electrical, etc.)" },
          location: { type: "string", description: "Project location" },
          pdf_url: { type: "string", description: "Link to bid documents" },
          source_url: { type: "string", description: "Original listing URL" }
        }
      }
    }
  }
};

export async function findBids(userQuery: string) {
  const result = await firecrawl.agent({
    prompt: `Find current government bids matching this request: "${userQuery}".
             Focus on California government sources including SFUSD, CaleProcure, and other municipal bid portals.
             Extract bid details including titles, due dates, budgets, required trades, and document links.`,
    schema: bidSchema,
    model: 'spark-1-pro'
  });

  return result;
}
```

**File: `src/lib/reducto.ts`**

```typescript
import { bidExtractionSchema } from './schemas';

const REDUCTO_API = 'https://platform.reducto.ai';

export async function extractBidFromPDF(pdfUrl: string) {
  const response = await fetch(`${REDUCTO_API}/extract`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.REDUCTO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: pdfUrl,
      instructions: {
        schema: bidExtractionSchema,
        system_prompt: 'Extract government bid details from this document.'
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Reducto error: ${response.statusText}`);
  }

  return response.json();
}

export async function extractMultiplePDFs(pdfUrls: string[]) {
  return Promise.all(pdfUrls.map(url => extractBidFromPDF(url)));
}
```

**File: `src/lib/resend.ts`**

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBidAlert(email: string, bid: {
  title: string;
  agency: string;
  dueDate: string;
  estimatedBudget: string;
  sourceUrl: string;
}) {
  const { data, error } = await resend.emails.send({
    from: 'Bid Alerts <onboarding@resend.dev>',
    to: [email],
    subject: `New Bid Match: ${bid.title}`,
    html: `
      <h1>New Government Bid Opportunity</h1>
      <h2>${bid.title}</h2>
      <p><strong>Agency:</strong> ${bid.agency}</p>
      <p><strong>Due Date:</strong> ${bid.dueDate}</p>
      <p><strong>Estimated Budget:</strong> ${bid.estimatedBudget}</p>
      <a href="${bid.sourceUrl}" style="
        background-color: #0070f3;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 6px;
        display: inline-block;
        margin-top: 16px;
      ">View Bid Details</a>
    `
  });

  if (error) throw error;
  return data;
}
```

### Phase 4: Tambo Tools (~20 min)

**File: `src/lib/tambo-tools.ts`**

```typescript
import { defineTool } from '@tambo-ai/react';
import { z } from 'zod';
import { findBids } from './firecrawl';
import { extractBidFromPDF } from './reducto';
import { sendBidAlert } from './resend';

export const tools = [
  // Main tool: Firecrawl Agent searches and extracts bids
  defineTool({
    name: 'findBids',
    description: 'Search for government bids matching user criteria. Uses AI to autonomously search government bid portals and extract matching opportunities.',
    tool: async ({ query }) => {
      const result = await findBids(query);
      return result;
    },
    inputSchema: z.object({
      query: z.string().describe('Natural language description of what bids to find (e.g., "plumbing projects for schools in SF")')
    }),
    outputSchema: z.object({
      bids: z.array(z.object({
        title: z.string(),
        bid_number: z.string().optional(),
        agency: z.string().optional(),
        due_date: z.string().optional(),
        estimated_budget: z.string().optional(),
        trades: z.array(z.string()).optional(),
        location: z.string().optional(),
        pdf_url: z.string().optional(),
        source_url: z.string().optional()
      }))
    })
  }),

  // Deep-dive tool: Reducto for detailed PDF analysis
  defineTool({
    name: 'analyzeBidPDF',
    description: 'Get detailed information from a bid PDF document - use when user wants more details about a specific bid',
    tool: async ({ pdfUrl }) => {
      const extracted = await extractBidFromPDF(pdfUrl);
      return extracted;
    },
    inputSchema: z.object({
      pdfUrl: z.string().url().describe('URL of the bid PDF to analyze')
    }),
    outputSchema: z.object({
      scope_summary: z.string().optional(),
      requirements: z.array(z.string()).optional(),
      trades_required: z.array(z.string()).optional(),
      qualifications: z.array(z.string()).optional(),
      timeline: z.string().optional()
    })
  }),

  // Alert tool: Resend for email notifications
  defineTool({
    name: 'sendBidAlert',
    description: 'Send an email alert about a bid opportunity',
    tool: async ({ email, bidTitle, agency, dueDate, budget, url }) => {
      await sendBidAlert(email, {
        title: bidTitle,
        agency,
        dueDate,
        estimatedBudget: budget,
        sourceUrl: url
      });
      return { success: true, message: `Alert sent to ${email}` };
    },
    inputSchema: z.object({
      email: z.string().email().describe('Email address to send alert to'),
      bidTitle: z.string().describe('Title of the bid'),
      agency: z.string().describe('Agency name'),
      dueDate: z.string().describe('Due date'),
      budget: z.string().describe('Estimated budget'),
      url: z.string().describe('URL to bid details')
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string()
    })
  })
];
```

### Phase 5: Tambo Components (~30 min)

**File: `src/components/BidCard.tsx`**

```tsx
'use client';

interface BidCardProps {
  title: string;
  agency: string;
  dueDate: string;
  budget: string;
  location?: string;
  trades?: string[];
  url: string;
  onAlert?: () => void;
}

export function BidCard({
  title,
  agency,
  dueDate,
  budget,
  location,
  trades,
  url,
  onAlert
}: BidCardProps) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{agency}</p>

      <div className="mt-3 space-y-1 text-sm">
        <p><span className="font-medium">Due:</span> {dueDate}</p>
        <p><span className="font-medium">Budget:</span> {budget}</p>
        {location && <p><span className="font-medium">Location:</span> {location}</p>}
      </div>

      {trades && trades.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {trades.map((trade, i) => (
            <span
              key={i}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {trade}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          View Details
        </a>
        {onAlert && (
          <button
            onClick={onAlert}
            className="px-4 py-2 border border-gray-300 text-sm rounded hover:bg-gray-50"
          >
            Alert Me
          </button>
        )}
      </div>
    </div>
  );
}
```

**File: `src/components/tambo-components.ts`**

```typescript
import { z } from 'zod';
import { BidCard } from './BidCard';

export const components = [
  {
    name: 'BidCard',
    description: 'Display a government bid opportunity card',
    component: BidCard,
    propsSchema: z.object({
      title: z.string(),
      agency: z.string(),
      dueDate: z.string(),
      budget: z.string(),
      location: z.string().optional(),
      trades: z.array(z.string()).optional(),
      url: z.string()
    })
  }
];
```

### Phase 6: Chat Interface (~30 min)

**File: `src/app/page.tsx`**

```tsx
'use client';

import { TamboProvider } from '@tambo-ai/react';
import { tools } from '@/lib/tambo-tools';
import { components } from '@/components/tambo-components';
import { ChatInterface } from '@/components/ChatInterface';

export default function Home() {
  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      tools={tools}
      components={components}
      streaming={true}
    >
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-4">
          <header className="text-center py-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Government Bid Finder
            </h1>
            <p className="text-gray-600 mt-2">
              Find matching government bids using natural language
            </p>
          </header>

          <ChatInterface />
        </div>
      </main>
    </TamboProvider>
  );
}
```

**File: `src/components/ChatInterface.tsx`**

```tsx
'use client';

import { useTamboThread, useTamboThreadInput } from '@tambo-ai/react';
import { useState } from 'react';

export function ChatInterface() {
  const { thread, generationStage } = useTamboThread();
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const [email, setEmail] = useState('');

  const isLoading = isPending || generationStage !== 'idle';

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Messages */}
      <div className="h-[500px] overflow-y-auto p-4 space-y-4">
        {thread?.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.content.map((part, i) =>
                part.type === 'text' ? <p key={i}>{part.text}</p> : null
              )}
              {message.renderedComponent}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submit()}
            placeholder="e.g., Find plumbing projects for schools in SF..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={() => submit()}
            disabled={isLoading || !value.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Search
          </button>
        </div>

        {/* Email for alerts */}
        <div className="mt-2 flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email for bid alerts"
            className="flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
```

### Phase 7: Test & Demo (~30 min)

1. Run `npm run dev`
2. Test query: "Find construction projects for schools"
3. Test query: "Show me plumbing bids in San Francisco"
4. Test email alert functionality
5. Verify Firecrawl scrapes both sites
6. Verify Reducto extracts PDF content

## Acceptance Criteria

- [ ] `npm run dev` starts without errors
- [ ] Chat interface renders
- [ ] User can type natural language query
- [ ] Firecrawl scrapes SFUSD successfully
- [ ] Firecrawl scrapes CaleProcure (with JS wait)
- [ ] Reducto extracts at least one PDF
- [ ] LLM returns relevant bid matches
- [ ] BidCard components render in chat
- [ ] Resend sends email alert
- [ ] Live demo works without mock data

## Demo Script

1. Open browser, show the two source sites (prove they're real)
2. Type: "Looking for school construction projects involving plumbing"
3. Watch it scrape live → parse PDFs → show matching bids
4. Click "Alert me" on a bid → show email received
5. Tell judges: "Adding Oakland or San Jose is config, not code"

## What We're NOT Building (Tradeoffs)

- No dashboard/admin panel - chat only
- No user accounts - email capture only
- No bid history database - fresh scrape each time
- No continuous polling - on-demand only
- California only - not multi-state

## Environment Variables Needed

```
FIRECRAWL_API_KEY=
REDUCTO_API_KEY=
RESEND_API_KEY=
OPENROUTER_API_KEY=
NEXT_PUBLIC_TAMBO_API_KEY=
```

## File Structure

```
src/
├── app/
│   └── page.tsx              # Main page with TamboProvider
├── components/
│   ├── BidCard.tsx           # Bid display component
│   ├── ChatInterface.tsx     # Chat UI
│   └── tambo-components.ts   # Component registry
├── lib/
│   ├── firecrawl.ts          # Scraping functions
│   ├── reducto.ts            # PDF extraction
│   ├── resend.ts             # Email sending
│   ├── schemas.ts            # Zod & Reducto schemas
│   └── tambo-tools.ts        # Tool definitions
└── types/
    └── bid.ts                # TypeScript types
```
