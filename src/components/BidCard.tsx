'use client';

import { Bid } from '@/types/bid';
import { Calendar, DollarSign, MapPin, Hash, FileText, Bell, ExternalLink, Check, Clock, AlertTriangle } from 'lucide-react';

interface BidCardProps {
  bid: Bid;
  score?: number;
  isSelected?: boolean;
  onSelect?: (bid: Bid) => void;
  onAlert?: (bid: Bid) => void;
  onAnalyze?: (pdfUrl: string) => void;
}

export function BidCard({ bid, score, isSelected, onSelect, onAlert, onAnalyze }: BidCardProps) {
  // Defensive: ensure bid object exists
  if (!bid) return null;

  // Score color based on value
  const getScoreColor = (s: number) => {
    if (s >= 70) return 'text-green-600 border-green-500 bg-green-500/10';
    if (s >= 40) return 'text-yellow-600 border-yellow-500 bg-yellow-500/10';
    return 'text-red-500 border-red-400 bg-red-500/10';
  };

  return (
    <div
      className={`group border rounded-lg bg-card transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-primary/30'
      }`}
      onClick={() => onSelect?.(bid)}
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-start justify-between gap-3">
          {/* Score Badge */}
          {score !== undefined && (
            <div className={`flex-shrink-0 w-11 h-11 rounded-full border-2 flex flex-col items-center justify-center ${getScoreColor(score)}`}>
              <span className="text-sm font-bold leading-none">{score}</span>
              <span className="text-[8px] uppercase tracking-wide leading-none">match</span>
            </div>
          )}
          {/* Selection indicator (only show if no score) */}
          {isSelected && score === undefined && (
            <div className="flex-shrink-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground line-clamp-2 leading-tight">
              {bid.title || 'Untitled Bid'}
            </h3>
            {bid.agency && (
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                {bid.agency}
              </p>
            )}
          </div>
          {bid.bid_number && (
            <span className="flex-shrink-0 px-2 py-1 bg-muted text-xs font-mono text-muted-foreground rounded">
              #{bid.bid_number}
            </span>
          )}
        </div>
      </div>

      {/* Scope Summary */}
      {bid.scope_summary && (
        <div className="px-4 pt-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {bid.scope_summary}
          </p>
        </div>
      )}

      {/* Data Grid */}
      <div className="p-4 grid grid-cols-2 gap-3 text-sm">
        {bid.due_date && (
          <DataField icon={Calendar} label="Due" value={bid.due_date} highlight />
        )}
        {(bid.estimated_budget || bid.pay?.estimated_budget) && (
          <DataField icon={DollarSign} label="Budget" value={bid.pay?.estimated_budget || bid.estimated_budget || ''} />
        )}
        {bid.location && (
          <DataField icon={MapPin} label="Location" value={bid.location} />
        )}
        {bid.contract_length?.duration && (
          <DataField icon={Clock} label="Duration" value={bid.contract_length.duration} />
        )}
        {bid.hard_requirements && bid.hard_requirements.length > 0 && (
          <DataField
            icon={AlertTriangle}
            label="Requirements"
            value={`${bid.hard_requirements.length} mandatory`}
          />
        )}
      </div>

      {/* Trades Tags */}
      {((bid.trades && bid.trades.length > 0) || (bid.trades_required && bid.trades_required.length > 0)) && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {(bid.trades || bid.trades_required || []).map((trade, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-accent/20 text-accent text-xs font-mono rounded border border-accent/30"
              >
                {trade}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
        {/* Primary action: View PDF if available, otherwise source URL */}
        {(bid.pdf_url || bid.source_url) && (
          <a
            href={bid.pdf_url || bid.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded hover:bg-primary/90 transition-colors"
          >
            {bid.pdf_url ? <FileText className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
            {bid.pdf_url ? 'View PDF' : 'View'}
          </a>
        )}

        {/* Analyze button only if we have PDF and handler */}
        {bid.pdf_url && onAnalyze && (
          <button
            onClick={() => onAnalyze(bid.pdf_url!)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-foreground text-xs font-medium rounded hover:bg-muted transition-colors"
          >
            <FileText className="w-3 h-3" />
            Analyze
          </button>
        )}

        {onAlert && (
          <button
            onClick={() => onAlert(bid)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-accent/50 text-accent text-xs font-medium rounded hover:bg-accent/10 transition-colors"
          >
            <Bell className="w-3 h-3" />
            Alert
          </button>
        )}
      </div>
    </div>
  );
}

function DataField({
  icon: Icon,
  label,
  value,
  highlight = false
}: {
  icon: any;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={`font-mono text-sm truncate ${highlight ? 'text-primary font-medium' : 'text-foreground'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
