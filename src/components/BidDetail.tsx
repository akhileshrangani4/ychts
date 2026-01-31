'use client';

import { useState } from 'react';
import { useTamboComponentState } from '@tambo-ai/react';
import { FileText, Clock, CheckCircle2, Wrench, ClipboardList, Mail, Send, Loader2, DollarSign, AlertTriangle, XCircle, Target, Calendar } from 'lucide-react';

interface BidAsk {
  summary?: string;
  deliverables?: string[];
}

interface Pay {
  estimated_budget?: string;
  payment_terms?: string;
  retainage?: string;
}

interface ContractLength {
  duration?: string;
  start_date?: string;
  end_date?: string;
  milestones?: string[];
}

interface TerminationClauses {
  for_cause?: string;
  for_convenience?: string;
  notice_period?: string;
}

interface BidDetailProps {
  title?: string;
  agency?: string;
  scope_summary?: string;
  bid_ask?: BidAsk;
  pay?: Pay;
  contract_length?: ContractLength;
  hard_requirements?: string[];
  soft_requirements?: string[];
  termination_clauses?: TerminationClauses;
  trades_required?: string[];
  pdf_url?: string;
  due_date?: string;
  estimated_budget?: string;
}

export function BidDetail({
  title,
  agency,
  scope_summary,
  bid_ask,
  pay,
  contract_length,
  hard_requirements = [],
  soft_requirements = [],
  termination_clauses,
  trades_required = [],
  pdf_url,
  due_date,
  estimated_budget,
}: BidDetailProps) {
  // Track email with Tambo state so AI knows what email was entered
  const [email, setEmail] = useTamboComponentState<string>('alertEmail', '');
  const [alertSent, setAlertSent] = useTamboComponentState<boolean>('alertSent', false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendAlert = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetch('/api/bids/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          bidTitle: title || 'Government Bid',
          agency: agency || 'Unknown Agency',
          dueDate: due_date || contract_length?.end_date || 'Not specified',
          budget: pay?.estimated_budget || estimated_budget || 'Not specified',
          url: pdf_url || '',
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setAlertSent(true);
      } else {
        setError(result.error || 'Failed to send alert');
      }
    } catch (err) {
      setError('Failed to send alert. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border bg-muted/30">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground leading-tight">
              {title || 'Bid Analysis'}
            </h2>
            {agency && (
              <p className="text-sm text-muted-foreground mt-1">{agency}</p>
            )}
          </div>
        </div>

      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Scope Summary */}
        {scope_summary && (
          <Section icon={ClipboardList} title="Scope of Work">
            <p className="text-sm text-foreground leading-relaxed">{scope_summary}</p>
          </Section>
        )}

        {/* Bid Ask */}
        {bid_ask && (bid_ask.summary || (bid_ask.deliverables && bid_ask.deliverables.length > 0)) && (
          <Section icon={Target} title="What They're Asking For">
            {bid_ask.summary && (
              <p className="text-sm text-foreground leading-relaxed mb-3">{bid_ask.summary}</p>
            )}
            {bid_ask.deliverables && bid_ask.deliverables.length > 0 && (
              <ul className="space-y-2">
                {bid_ask.deliverables.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

        {/* Pay */}
        {pay && (pay.estimated_budget || pay.payment_terms || pay.retainage) && (
          <Section icon={DollarSign} title="Payment & Budget">
            <div className="space-y-2 text-sm">
              {(pay.estimated_budget || estimated_budget) && (
                <div><span className="font-medium">Budget:</span> {pay.estimated_budget || estimated_budget}</div>
              )}
              {pay.payment_terms && (
                <div><span className="font-medium">Payment Terms:</span> {pay.payment_terms}</div>
              )}
              {pay.retainage && (
                <div><span className="font-medium">Retainage:</span> {pay.retainage}</div>
              )}
            </div>
          </Section>
        )}

        {/* Contract Length */}
        {contract_length && (contract_length.duration || contract_length.start_date || contract_length.end_date || (contract_length.milestones && contract_length.milestones.length > 0)) && (
          <Section icon={Calendar} title="Contract Timeline">
            <div className="space-y-2 text-sm">
              {contract_length.duration && (
                <div><span className="font-medium">Duration:</span> {contract_length.duration}</div>
              )}
              {contract_length.start_date && (
                <div><span className="font-medium">Start:</span> {contract_length.start_date}</div>
              )}
              {contract_length.end_date && (
                <div><span className="font-medium">End:</span> {contract_length.end_date}</div>
              )}
              {contract_length.milestones && contract_length.milestones.length > 0 && (
                <div className="mt-2">
                  <span className="font-medium">Milestones:</span>
                  <ul className="mt-1 space-y-1">
                    {contract_length.milestones.map((m, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Hard Requirements */}
        {hard_requirements.length > 0 && (
          <Section icon={AlertTriangle} title="Hard Requirements (Mandatory)">
            <ul className="space-y-2">
              {hard_requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Soft Requirements */}
        {soft_requirements.length > 0 && (
          <Section icon={CheckCircle2} title="Soft Requirements (Preferred)">
            <ul className="space-y-2">
              {soft_requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Termination Clauses */}
        {termination_clauses && (termination_clauses.for_cause || termination_clauses.for_convenience || termination_clauses.notice_period) && (
          <Section icon={XCircle} title="Termination Clauses">
            <div className="space-y-2 text-sm">
              {termination_clauses.for_cause && (
                <div><span className="font-medium">For Cause:</span> {termination_clauses.for_cause}</div>
              )}
              {termination_clauses.for_convenience && (
                <div><span className="font-medium">For Convenience:</span> {termination_clauses.for_convenience}</div>
              )}
              {termination_clauses.notice_period && (
                <div><span className="font-medium">Notice Period:</span> {termination_clauses.notice_period}</div>
              )}
            </div>
          </Section>
        )}

        {/* Trades Required */}
        {trades_required.length > 0 && (
          <Section icon={Wrench} title="Trades Required">
            <div className="flex flex-wrap gap-2">
              {trades_required.map((trade, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-accent/15 text-accent text-sm font-medium rounded-full border border-accent/30"
                >
                  {trade}
                </span>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Email Alert Section */}
      <div className="px-6 pb-6 pt-2 border-t border-border mt-2">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Get Notified
          </h3>
        </div>

        <div className="space-y-3">
          {alertSent && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-700">Alert sent to {email}!</p>
              </div>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {alertSent ? 'Send to another email:' : 'Enter your email to receive updates about this bid opportunity.'}
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (alertSent) setAlertSent(false);
              }}
              placeholder="your@email.com"
              className="flex-1 px-3 py-2 text-sm bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
            />
            <button
              onClick={handleSendAlert}
              disabled={sending || !email}
              className="px-4 py-2 bg-accent text-accent-foreground text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? 'Sending...' : 'Send Alert'}
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>
      </div>

      {/* Footer */}
      {pdf_url && (
        <div className="px-6 pb-6">
          <a
            href={pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <FileText className="w-4 h-4" />
            View Original PDF
          </a>
        </div>
      )}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}
