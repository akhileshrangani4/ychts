const REDUCTO_API = 'https://platform.reducto.ai';

// Schema for detailed bid PDF extraction
const bidDetailSchema = {
  type: 'object',
  properties: {
    scope_summary: {
      type: 'string',
      description: 'Summary of the project scope and work required'
    },
    requirements: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of requirements for bidders'
    },
    trades_required: {
      type: 'array',
      items: { type: 'string' },
      description: 'Specific trades needed (plumbing, electrical, HVAC, etc.)'
    },
    qualifications: {
      type: 'array',
      items: { type: 'string' },
      description: 'Required qualifications, licenses, or certifications'
    },
    timeline: {
      type: 'string',
      description: 'Project timeline or duration'
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
        system_prompt: 'Extract detailed information from this government bid document. Focus on scope of work, requirements, required trades, qualifications, and timeline.'
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Reducto error: ${response.status} - ${error}`);
  }

  return response.json();
}
