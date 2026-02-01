'use client';

import { useState } from 'react';
import { TamboProvider } from '@tambo-ai/react';
import { tamboComponents, tamboTools } from '@/lib/tambo-config';
import { MessageThreadPanel } from './tambo/message-thread-panel';
import { CanvasSpace } from './tambo/canvas-space';
import { BidMap } from './BidMap';
import { getGlobalSelectedBid, getGlobalMapSearch, clearMapSearchTrigger } from '@/lib/bid-selection-context';
import { Map, X } from 'lucide-react';

export function TamboWrapper() {
  const [isMapVisible, setIsMapVisible] = useState(true);

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={tamboComponents}
      tools={tamboTools}
      contextHelpers={{
        selectedBid: async () => {
          const bid = getGlobalSelectedBid();
          if (!bid) return { selectedBid: null };
          return { selectedBid: bid };
        },
        mapSearch: async () => {
          const mapSearch = getGlobalMapSearch();
          if (!mapSearch.searchTriggered || !mapSearch.bounds) {
            return { mapSearchActive: false };
          }
          clearMapSearchTrigger();
          return {
            mapSearchActive: true,
            areaName: mapSearch.bounds.areaName,
            bounds: mapSearch.bounds,
          };
        },
        bidMapUpdate: async () => {
          // Always remind Tambo to update the map when it has bid data
          return {
            reminder: 'When you have bid data with latitude/longitude, ALWAYS update the BidMap component by using the interactable update_component_props_BidMap tool to do this.',
          };
        },
      }}
    >
      <div className="flex h-full w-full overflow-hidden">
        {/* Chat Panel - Left side */}
        <MessageThreadPanel className="!h-full" />

        {/* Right side - Map on top, Canvas below */}
        <div className="flex-1 h-full flex flex-col overflow-hidden">
          {/* Map Panel - Top portion (collapsible) */}
          {isMapVisible ? (
            <div className="h-[45%] min-h-[300px] p-3 pb-1.5 bg-muted/20 relative">
              <button
                onClick={() => setIsMapVisible(false)}
                className="absolute top-4 right-4 z-20 p-1.5 rounded-md bg-background/80 backdrop-blur-sm border border-border hover:bg-muted transition-colors"
                aria-label="Close map"
              >
                <X className="w-4 h-4" />
              </button>
              <BidMap
                interactableId="main-bid-map"
                initialCenter={[37.7749, -122.4194]}
                initialZoom={9}
                onInteractableReady={(id) => console.log('BidMap registered with id:', id)}
                onPropsUpdate={(newProps) => console.log('BidMap props updated by Tambo:', newProps)}
              />
            </div>
          ) : (
            <div className="flex-shrink-0 p-2 bg-muted/20 border-b border-border">
              <button
                onClick={() => setIsMapVisible(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
              >
                <Map className="w-4 h-4" />
                Show Map
              </button>
            </div>
          )}

          {/* Canvas Space - Bottom portion for generated components */}
          <div className="flex-1 min-h-[200px] overflow-hidden">
            <CanvasSpace className="h-full !border-l-0" />
          </div>
        </div>
      </div>
    </TamboProvider>
  );
}
