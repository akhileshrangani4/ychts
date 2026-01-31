'use client';

import { z } from 'zod';
import { BidCard } from '@/components/BidCard';
import { BidList } from '@/components/BidList';
import { BidDetail } from '@/components/BidDetail';

// Component schemas for Tambo
// Shared bid schema - all fields optional strings
const bidSchema = z.object({
  title: z.string().optional().default(''),
  bid_number: z.string().optional().default(''),
  agency: z.string().optional().default(''),
  due_date: z.string().optional().default(''),
  estimated_budget: z.string().optional().default(''),
  trades: z.array(z.string()).optional().default([]),
  location: z.string().optional().default(''),
  pdf_url: z.string().optional().default(''),
  source_url: z.string().optional().default(''),
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
    description: 'Display detailed analysis of a bid document, including scope, requirements, trades, qualifications, and timeline. Includes email alert signup and a dropdown to select other bids. Use this after analyzing a bid PDF. Always pass allBids so user can select another bid.',
    component: BidDetail,
    propsSchema: z.object({
      title: z.string().optional().describe('Title of the bid'),
      agency: z.string().optional().describe('Agency name'),
      scope_summary: z.string().optional().describe('Summary of the project scope'),
      requirements: z.array(z.string()).optional().default([]).describe('List of requirements'),
      trades_required: z.array(z.string()).optional().default([]).describe('Required trades'),
      qualifications: z.array(z.string()).optional().default([]).describe('Required qualifications'),
      timeline: z.string().optional().describe('Project timeline'),
      pdf_url: z.string().optional().describe('URL to the original PDF'),
      due_date: z.string().optional().describe('Due date for the bid'),
      estimated_budget: z.string().optional().describe('Estimated budget'),
      allBids: z.array(bidSchema).optional().default([]).describe('All available bids so user can select another'),
    }),
  },
];

// Tool schemas for Tambo
export const tamboTools = [
  {
    name: 'findBids',
    description: 'Search for government bids matching user criteria. Use this when the user wants to find government contracts, bids, or procurement opportunities.',
    tool: async ({ query }: { query: string }) => {
      const response = await fetch('/api/bids/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      return response.json();
    },
    inputSchema: z.object({
      query: z.string().describe('Natural language description of what bids to find (e.g., "plumbing projects for schools in SF")'),
    }),
    outputSchema: z.object({
      bids: z.array(bidSchema).default([]),
    }),
  },
  {
    name: 'analyzeBidPDF',
    description: 'Get detailed information from a bid PDF document using Reducto AI. Use this when the user wants more details about a specific bid, says "analyze this bid", "tell me more", or has selected a bid. Check the selectedBid or newSelectedBid component state to get the pdf_url. After getting results, display them using the BidDetail component with allBids so user can select another.',
    tool: async ({ pdfUrl, title, agency, due_date, estimated_budget, allBids }: {
      pdfUrl: string;
      title?: string;
      agency?: string;
      due_date?: string;
      estimated_budget?: string;
      allBids?: Array<Record<string, unknown>>;
    }) => {
      const response = await fetch('/api/bids/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfUrl }),
      });
      const result = await response.json();
      // Include bid info for display, email alerts, and bid selector
      return { ...result, title, agency, pdf_url: pdfUrl, due_date, estimated_budget, allBids };
    },
    inputSchema: z.object({
      pdfUrl: z.string().url().describe('URL of the bid PDF to analyze. Get this from selectedBid or newSelectedBid component state.'),
      title: z.string().optional().describe('Title of the bid being analyzed'),
      agency: z.string().optional().describe('Agency name of the bid'),
      due_date: z.string().optional().describe('Due date of the bid'),
      estimated_budget: z.string().optional().describe('Estimated budget of the bid'),
      allBids: z.array(bidSchema).optional().describe('All available bids from the previous search results'),
    }),
    outputSchema: z.object({
      title: z.string().optional(),
      agency: z.string().optional(),
      pdf_url: z.string().optional(),
      due_date: z.string().optional(),
      estimated_budget: z.string().optional(),
      scope_summary: z.string().optional(),
      requirements: z.array(z.string()).optional(),
      trades_required: z.array(z.string()).optional(),
      qualifications: z.array(z.string()).optional(),
      timeline: z.string().optional(),
      allBids: z.array(bidSchema).optional(),
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
