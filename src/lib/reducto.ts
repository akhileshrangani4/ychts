const REDUCTO_API = 'https://platform.reducto.ai';

// Schema for detailed bid PDF extraction
const bidDetailSchema = {
  type: 'object',
  properties: {
    scope_summary: {
      type: 'string',
      description: 'Summary of the project scope and work required'
    },
    bid_ask: {
      type: 'object',
      description: 'What the bid is asking for - the main deliverables and services requested',
      properties: {
        summary: { type: 'string', description: 'Brief summary of what is being requested' },
        deliverables: { type: 'array', items: { type: 'string' }, description: 'List of specific deliverables' }
      }
    },
    pay: {
      type: 'object',
      description: 'Payment terms and budget information',
      properties: {
        estimated_budget: { type: 'string', description: 'Estimated budget or price range' },
        payment_terms: { type: 'string', description: 'Payment schedule and terms' },
        retainage: { type: 'string', description: 'Any retainage or holdback percentage' }
      }
    },
    contract_length: {
      type: 'object',
      description: 'Duration and timeline of the contract',
      properties: {
        duration: { type: 'string', description: 'Total contract duration' },
        start_date: { type: 'string', description: 'Expected start date' },
        end_date: { type: 'string', description: 'Expected end date or deadline' },
        milestones: { type: 'array', items: { type: 'string' }, description: 'Key milestones' }
      }
    },
    hard_requirements: {
      type: 'array',
      items: { type: 'string' },
      description: 'Mandatory requirements that must be met - licenses, certifications, bonding, insurance minimums, etc.'
    },
    soft_requirements: {
      type: 'array',
      items: { type: 'string' },
      description: 'Preferred but not mandatory requirements - experience preferences, nice-to-haves'
    },
    termination_clauses: {
      type: 'object',
      description: 'Contract termination terms and conditions',
      properties: {
        for_cause: { type: 'string', description: 'Termination for cause conditions' },
        for_convenience: { type: 'string', description: 'Termination for convenience terms' },
        notice_period: { type: 'string', description: 'Required notice period for termination' }
      }
    },
    trades_required: {
      type: 'array',
      items: { type: 'string' },
      description: 'Specific trades needed (plumbing, electrical, HVAC, etc.)'
    }
  }
};

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
        schema: bidDetailSchema,
        system_prompt: 'Extract detailed information from this government bid/RFP document. Focus on: 1) What is being asked for (bid_ask), 2) Payment terms and budget (pay), 3) Contract duration and timeline (contract_length), 4) Mandatory requirements like licenses, insurance, bonding (hard_requirements), 5) Preferred qualifications (soft_requirements), 6) Termination clauses and conditions, 7) Required trades. Be thorough and extract specific dollar amounts, dates, and percentages where available.'
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Reducto error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // Reducto returns data in result array - extract the first item
  if (data.result && Array.isArray(data.result) && data.result.length > 0) {
    return data.result[0];
  }

  // Fallback if structure is different
  return data.result || data;
}
