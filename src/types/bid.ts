export interface Bid {
  title: string;
  bid_number?: string;
  agency?: string;
  due_date?: string;
  estimated_budget?: string;
  trades?: string[];
  location?: string;
  pdf_url?: string;
  source_url?: string;
}

export interface BidSearchResult {
  bids: Bid[];
}

export interface BidDetails {
  scope_summary?: string;
  requirements?: string[];
  trades_required?: string[];
  qualifications?: string[];
  timeline?: string;
}
