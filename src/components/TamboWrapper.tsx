'use client';

import { TamboProvider } from '@tambo-ai/react';
import { tamboComponents, tamboTools } from '@/lib/tambo-config';
import { CanvasSpace } from './tambo/canvas-space';
import { MessageThreadPanel } from './tambo/message-thread-panel';

export function TamboWrapper() {
  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={tamboComponents}
      tools={tamboTools}
    >
      <div className="flex h-full w-full overflow-hidden">
        <MessageThreadPanel className="!h-full" />
        <CanvasSpace className="!h-full" />
      </div>
    </TamboProvider>
  );
}
