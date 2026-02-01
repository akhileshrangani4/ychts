'use client';

import { Bid } from '@/types/bid';
import { BidCard } from './BidCard';
import { SearchX, Briefcase, CheckCircle2, Trophy } from 'lucide-react';
import { useTamboComponentState } from '@tambo-ai/react';
import { setGlobalSelectedBid } from '@/lib/bid-selection-context';
import { ScoredBid } from '@/lib/bid-scoring';

interface BidListProps {
  bids: (Bid | ScoredBid)[];
  onAlert?: (bid: Bid) => void;
  onAnalyze?: (pdfUrl: string) => void;
}

export function BidList({ bids = [], onAlert, onAnalyze }: BidListProps) {
  // Track selected bid with Tambo state - AI can see which bid the user selected
  const [selectedBid, setSelectedBid] = useTamboComponentState<Bid | null>('selectedBid', null);

  // Defensive check - ensure bids is always an array
  const safeBids = Array.isArray(bids) ? bids : [];
  
  // Check if bids have scores
  const hasScores = safeBids.length > 0 && typeof (safeBids[0] as ScoredBid).score === 'number';

  if (safeBids.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-lg bg-muted/50 border border-border flex items-center justify-center mb-4">
          <SearchX className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-mono text-sm">
          No bids found matching your criteria.
        </p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          Try adjusting your search terms.
        </p>
      </div>
    );
  }

  const handleSelectBid = (bid: Bid) => {
    setSelectedBid(bid);
    // Also set global state for context helper
    setGlobalSelectedBid(bid);
  };

  return (
    <div className="space-y-4">
      {/* Selected Bid Indicator */}
      {selectedBid && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">Selected:</span>
            <span className="text-muted-foreground truncate">{selectedBid.title}</span>
            <button
              onClick={() => {
                setSelectedBid(null);
                setGlobalSelectedBid(null);
              }}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            You can now ask questions about this bid, like &quot;analyze this bid&quot; or &quot;set an alert for this&quot;
          </p>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
        <Briefcase className="w-4 h-4 text-primary" />
        <span className="text-sm font-mono text-muted-foreground">
          <span className="text-primary font-semibold">{safeBids.length}</span> opportunities found
        </span>
        {hasScores && (
          <span className="ml-auto text-xs text-muted-foreground">Sorted by match score</span>
        )}
      </div>

      {/* Best Match Banner */}
      {hasScores && safeBids.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
          <Trophy className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">Best Match:</span>
          <span className="text-sm text-foreground truncate">{safeBids[0].title}</span>
          <span className="ml-auto text-sm font-bold text-green-600">{(safeBids[0] as ScoredBid).score}%</span>
        </div>
      )}

      {/* Bid Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 stagger-children">
        {safeBids.map((bid, index) => (
          <BidCard
            key={`${bid.bid_number || 'bid'}-${index}`}
            bid={bid}
            score={(bid as ScoredBid).score}
            isSelected={selectedBid?.bid_number === bid.bid_number && selectedBid?.title === bid.title}
            onSelect={handleSelectBid}
            onAlert={onAlert}
            onAnalyze={onAnalyze}
          />
        ))}
      </div>
    </div>
  );
}
