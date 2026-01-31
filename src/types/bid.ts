export interface BidAsk {
  summary?: string;
  deliverables?: string[];
}

export interface BidPay {
  estimated_budget?: string;
  payment_terms?: string;
  retainage?: string;
}

export interface ContractLength {
  duration?: string;
  start_date?: string;
  end_date?: string;
  milestones?: string[];
}

export interface TerminationClauses {
  for_cause?: string;
  for_convenience?: string;
  notice_period?: string;
}

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
  // Detailed extraction fields
  scope_summary?: string;
  bid_ask?: BidAsk;
  pay?: BidPay;
  contract_length?: ContractLength;
  hard_requirements?: string[];
  soft_requirements?: string[];
  termination_clauses?: TerminationClauses;
  trades_required?: string[];
}

export interface BidSearchResult {
  bids: Bid[];
}
