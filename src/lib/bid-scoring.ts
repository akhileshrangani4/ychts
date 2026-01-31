import { Bid } from '@/types/bid';
import { UserProfile } from './user-profile';

export interface ScoredBid extends Bid {
  score: number; // 0-100
}

/**
 * Calculate match score for a single bid (0-100)
 */
export function calculateBidScore(
  bid: Bid,
  profile: UserProfile,
  query: string
): number {
  const tradesScore = calculateTradesMatch(bid, profile);
  const requirementsScore = calculateRequirementsFit(bid);
  const budgetScore = calculateBudgetFit(bid, profile);
  const relevanceScore = calculateQueryRelevance(bid, query);

  // Weighted average
  const score = Math.round(
    tradesScore * 0.35 +
    requirementsScore * 0.25 +
    budgetScore * 0.20 +
    relevanceScore * 0.20
  );

  return Math.min(100, Math.max(0, score));
}

/**
 * Score and sort all bids by match percentage
 */
export function scoreAndSortBids(
  bids: Bid[],
  profile: UserProfile,
  query: string
): ScoredBid[] {
  const scored = bids.map((bid) => ({
    ...bid,
    score: calculateBidScore(bid, profile, query),
  }));

  // Sort by score descending
  return scored.sort((a, b) => b.score - a.score);
}

// --- Scoring Functions ---

function calculateTradesMatch(bid: Bid, profile: UserProfile): number {
  const bidTrades = bid.trades_required || bid.trades || [];
  if (bidTrades.length === 0) return 50; // No trades specified, neutral score

  const profileTradesLower = profile.trades.map((t) => t.toLowerCase());
  const matchCount = bidTrades.filter((t) =>
    profileTradesLower.some((pt) => t.toLowerCase().includes(pt) || pt.includes(t.toLowerCase()))
  ).length;

  return Math.round((matchCount / bidTrades.length) * 100);
}

function calculateRequirementsFit(bid: Bid): number {
  const hardReqs = bid.hard_requirements || [];
  // Fewer requirements = easier to win = higher score
  // 0 reqs = 100, 5+ reqs = 50
  const penalty = Math.min(hardReqs.length * 10, 50);
  return 100 - penalty;
}

function calculateBudgetFit(bid: Bid, profile: UserProfile): number {
  const budgetStr = bid.pay?.estimated_budget || bid.estimated_budget || '';
  const amount = parseBudget(budgetStr);
  
  if (!amount) return 50; // Unknown budget, neutral score

  if (amount >= profile.preferredBudgetMin && amount <= profile.preferredBudgetMax) {
    return 100; // Perfect fit
  }

  // Outside range - calculate how far off
  if (amount < profile.preferredBudgetMin) {
    const ratio = amount / profile.preferredBudgetMin;
    return Math.round(ratio * 100);
  } else {
    const ratio = profile.preferredBudgetMax / amount;
    return Math.round(ratio * 100);
  }
}

function calculateQueryRelevance(bid: Bid, query: string): number {
  if (!query.trim()) return 100; // No query = all relevant

  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const bidText = `${bid.title || ''} ${bid.scope_summary || ''} ${(bid.trades || []).join(' ')} ${(bid.trades_required || []).join(' ')}`.toLowerCase();

  const matchCount = queryWords.filter((word) => bidText.includes(word)).length;
  return Math.round((matchCount / queryWords.length) * 100);
}

// --- Helpers ---

function parseBudget(str: string): number | null {
  if (!str) return null;
  
  // Extract numbers, handle K/M suffixes
  const match = str.match(/([\d,.]+)\s*(k|m|million|thousand)?/i);
  if (!match) return null;

  let num = parseFloat(match[1].replace(/,/g, ''));
  const suffix = match[2]?.toLowerCase();

  if (suffix === 'k' || suffix === 'thousand') num *= 1000;
  if (suffix === 'm' || suffix === 'million') num *= 1000000;

  return num;
}
