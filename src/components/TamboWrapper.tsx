'use client';

import { TamboProvider } from '@tambo-ai/react';
import { tamboComponents, tamboTools } from '@/lib/tambo-config';
import { CanvasSpace } from './tambo/canvas-space';
import { MessageThreadPanel } from './tambo/message-thread-panel';
import { getGlobalSelectedBid } from '@/lib/bid-selection-context';

export function TamboWrapper() {
  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={tamboComponents}
      tools={tamboTools}
      contextHelpers={{
        selectedBid: async () => {
          const bid = getGlobalSelectedBid();
          if (!bid) return { selectedBid: null };
          return {
            selectedBid: bid,
            message: `User has selected this bid: "${bid.title}" by ${bid.agency}. PDF URL: ${bid.pdf_url}`,
          };
        },
      }}
    >
      <div className="flex h-full w-full overflow-hidden">
        <MessageThreadPanel className="!h-full" />
        <CanvasSpace className="!h-full" />
      </div>
    </TamboProvider>
  );
}
