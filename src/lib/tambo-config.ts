'use client';

import { z } from 'zod';
import { BidCard } from '@/components/BidCard';
import { BidList } from '@/components/BidList';
import { BidDetail } from '@/components/BidDetail';
import { scoreAndSortBids } from '@/lib/bid-scoring';
import { DEFAULT_USER_PROFILE } from '@/lib/user-profile';
// Note: BidMap is pre-placed in the UI as an interactable component, not generated

// Component schemas for Tambo
// Shared bid schema - all fields optional, accepts nulls via nullish()
const bidSchema = z.object({
  title: z.string().nullish().default(''),
  bid_number: z.string().nullish(),
  agency: z.string().nullish(),
  due_date: z.string().nullish(),
  estimated_budget: z.string().nullish(),
  trades: z.array(z.string()).nullish().default([]),
  location: z.string().nullish(),
  pdf_url: z.string().nullish(),
  source_url: z.string().nullish(),
  // Coordinates for map display
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  // Detailed extraction fields for enhanced display
  scope_summary: z.string().nullish(),
  bid_ask: z.object({
    summary: z.string().nullish(),
    deliverables: z.array(z.string()).nullish(),
  }).nullish(),
  pay: z.object({
    estimated_budget: z.string().nullish(),
    payment_terms: z.string().nullish(),
    retainage: z.string().nullish(),
  }).nullish(),
  contract_length: z.object({
    duration: z.string().nullish(),
    start_date: z.string().nullish(),
    end_date: z.string().nullish(),
    milestones: z.array(z.string()).nullish(),
  }).nullish(),
  hard_requirements: z.array(z.string()).nullish(),
  soft_requirements: z.array(z.string()).nullish(),
  termination_clauses: z.object({
    for_cause: z.string().nullish(),
    for_convenience: z.string().nullish(),
    notice_period: z.string().nullish(),
  }).nullish(),
  trades_required: z.array(z.string()).nullish(),
  // Scoring field
  score: z.number().nullish(),
});

export const tamboComponents = [
  {
    name: 'BidCard',
    description: 'Display a single government bid opportunity',
    component: BidCard,
    propsSchema: z.object({
      bid: bidSchema,
    }),
  },
  {
    name: 'BidList',
    description: 'Display a list of government bid opportunities. Users can click to select a bid.',
    component: BidList,
    propsSchema: z.object({
      bids: z.array(bidSchema).default([]),
    }),
  },
  {
    name: 'BidDetail',
    description: 'Display detailed analysis of a bid document. Shows bid ask, pay, contract length, hard/soft requirements, termination clauses, and trades. Includes email alert signup. Use this after analyzing a bid PDF.',
    component: BidDetail,
    propsSchema: z.object({
      title: z.string().nullish().describe('Title of the bid'),
      agency: z.string().nullish().describe('Agency name'),
      scope_summary: z.string().nullish().describe('Summary of the project scope'),
      bid_ask: z.object({
        summary: z.string().nullish(),
        deliverables: z.array(z.string()).nullish(),
      }).nullish().describe('What the bid is asking for'),
      pay: z.object({
        estimated_budget: z.string().nullish(),
        payment_terms: z.string().nullish(),
        retainage: z.string().nullish(),
      }).nullish().describe('Payment terms and budget'),
      contract_length: z.object({
        duration: z.string().nullish(),
        start_date: z.string().nullish(),
        end_date: z.string().nullish(),
        milestones: z.array(z.string()).nullish(),
      }).nullish().describe('Contract duration and timeline'),
      hard_requirements: z.array(z.string()).nullish().describe('Mandatory requirements'),
      soft_requirements: z.array(z.string()).nullish().describe('Preferred requirements'),
      termination_clauses: z.object({
        for_cause: z.string().nullish(),
        for_convenience: z.string().nullish(),
        notice_period: z.string().nullish(),
      }).nullish().describe('Termination terms'),
      trades_required: z.array(z.string()).nullish().describe('Required trades'),
      pdf_url: z.string().nullish().describe('URL to the original PDF'),
      due_date: z.string().nullish().describe('Due date for the bid'),
      estimated_budget: z.string().nullish().describe('Estimated budget'),
    }),
  },
  // BidMap is pre-placed in the UI as an interactable component (id: "main-bid-map")
  // Tambo can update it via: updateInteractableComponentProps("main-bid-map", { bids: [...], initialCenter: [...], initialZoom: N })
];

// Tool schemas for Tambo
export const tamboTools = [
  {
    name: 'findBids',
    description: `Search for government bids using Firecrawl to scrape SFUSD and CaleProcure. Results are scored and sorted by match percentage.

IMPORTANT: After calling this tool:
1. Display results using BidList component
2. Update the BidMap interactable component by setting its "bids" prop to the array returned by this tool (data.bids). Each bid has latitude and longitude fields for map markers.`,
    tool: async ({ query }: { query: string }) => {
      const response = await fetch('/api/bids/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const result = await response.json();
      
      // Score and sort bids using user profile
      const bids = result.data?.bids || result.bids || [];
      const scoredBids = scoreAndSortBids(bids, DEFAULT_USER_PROFILE, query);
      
      return { bids: scoredBids };
    },
    inputSchema: z.object({
      query: z.string().describe('Natural language description of what bids to find (e.g., "plumbing projects for schools in SF")'),
    }),
    outputSchema: z.object({
      data: z.object({
        bids: z.array(bidSchema).default([]),
      }),
    }),
  },
  {
    name: 'analyzeBidPDF',
    description: 'Analyze a bid PDF document using Reducto AI to extract scope, requirements, trades, qualifications, and timeline. ALWAYS use this tool when user says "analyze this bid", "tell me more", "what does this bid require", or similar. Get the pdf_url from the selectedBid in the context (provided by contextHelpers). After getting results, display them using the BidDetail component.',
    tool: async ({ pdfUrl, title, agency, due_date, estimated_budget }: {
      pdfUrl: string;
      title?: string;
      agency?: string;
      due_date?: string;
      estimated_budget?: string;
    }) => {
      const response = await fetch('/api/bids/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfUrl }),
      });
      const result = await response.json();
      // Include bid info for display and email alerts
      return { ...result, title, agency, pdf_url: pdfUrl, due_date, estimated_budget };
    },
    inputSchema: z.object({
      pdfUrl: z.string().url().describe('URL of the bid PDF to analyze. Get this from selectedBid component state.'),
      title: z.string().optional().describe('Title of the bid being analyzed'),
      agency: z.string().optional().describe('Agency name of the bid'),
      due_date: z.string().optional().describe('Due date of the bid'),
      estimated_budget: z.string().optional().describe('Estimated budget of the bid'),
    }),
    outputSchema: z.object({
      title: z.string().nullish(),
      agency: z.string().nullish(),
      pdf_url: z.string().nullish(),
      due_date: z.string().nullish(),
      estimated_budget: z.string().nullish(),
      scope_summary: z.string().nullish(),
      bid_ask: z.object({
        summary: z.string().nullish(),
        deliverables: z.array(z.string()).nullish(),
      }).nullish(),
      pay: z.object({
        estimated_budget: z.string().nullish(),
        payment_terms: z.string().nullish(),
        retainage: z.string().nullish(),
      }).nullish(),
      contract_length: z.object({
        duration: z.string().nullish(),
        start_date: z.string().nullish(),
        end_date: z.string().nullish(),
        milestones: z.array(z.string()).nullish(),
      }).nullish(),
      hard_requirements: z.array(z.string()).nullish(),
      soft_requirements: z.array(z.string()).nullish(),
      termination_clauses: z.object({
        for_cause: z.string().nullish(),
        for_convenience: z.string().nullish(),
        notice_period: z.string().nullish(),
      }).nullish(),
      trades_required: z.array(z.string()).nullish(),
    }),
  },
  {
    name: 'sendBidAlert',
    description: 'Send an email alert about a bid opportunity. Use this when the user wants to be notified about a specific bid.',
    tool: async ({ email, bidTitle, agency, dueDate, budget, url }: {
      email: string;
      bidTitle: string;
      agency: string;
      dueDate: string;
      budget: string;
      url: string;
    }) => {
      const response = await fetch('/api/bids/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, bidTitle, agency, dueDate, budget, url }),
      });
      return response.json();
    },
    inputSchema: z.object({
      email: z.string().email().describe('Email address to send alert to'),
      bidTitle: z.string().describe('Title of the bid'),
      agency: z.string().describe('Agency name'),
      dueDate: z.string().describe('Due date'),
      budget: z.string().describe('Estimated budget'),
      url: z.string().describe('URL to bid details'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
];
