'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { withInteractable, useTamboThreadInput } from '@tambo-ai/react';
import { MapPin, Search, Loader2, DollarSign, Calendar, Building2 } from 'lucide-react';
import { z } from 'zod';
import {
  Map,
  MapControls,
  useMap,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapClusterLayer,
  MapPopup
} from '@/components/ui/map';
import { setGlobalMapSearch, setGlobalSelectedBid } from '@/lib/bid-selection-context';

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
  centerLat: number;
  centerLng: number;
  areaName: string;
}

interface BidLocation {
  title?: string;
  agency?: string;
  due_date?: string;
  estimated_budget?: string;
  location?: string;
  pdf_url?: string;
  latitude: number;
  longitude: number;
}

interface BidMapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  bids?: BidLocation[];
  interactableId?: string;
  onInteractableReady?: (id: string) => void;
  onPropsUpdate?: (newProps: Record<string, unknown>) => void;
}

// Get area name from coordinates
function getAreaName(lat: number, lng: number): string {
  if (lat > 37.5 && lat < 38 && lng > -122.6 && lng < -122.2) {
    return 'San Francisco Bay Area';
  } else if (lat > 33.9 && lat < 34.2 && lng > -118.5 && lng < -118.1) {
    return 'Los Angeles';
  } else if (lat > 32.6 && lat < 33 && lng > -117.3 && lng < -116.9) {
    return 'San Diego';
  } else if (lat > 38.5 && lat < 38.7 && lng > -121.6 && lng < -121.3) {
    return 'Sacramento';
  } else if (lat > 37.3 && lat < 37.5 && lng > -122.1 && lng < -121.8) {
    return 'San Jose';
  } else if (lat > 37.8 && lat < 38.1 && lng > -122.4 && lng < -122.0) {
    return 'Oakland / East Bay';
  }
  return 'the selected area';
}

// Inner component that captures map bounds - no state updates, just refs
function MapBoundsCapture({ onBoundsChange }: { onBoundsChange: (bounds: MapBounds) => void }) {
  const { map, isLoaded } = useMap();
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;

  useEffect(() => {
    if (!map || !isLoaded) return;

    const updateBounds = () => {
      const bounds = map.getBounds();
      const center = map.getCenter();

      onBoundsChangeRef.current({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
        centerLat: center.lat,
        centerLng: center.lng,
        areaName: getAreaName(center.lat, center.lng),
      });
    };

    // Initial bounds after a short delay to ensure map is ready
    const timer = setTimeout(updateBounds, 100);

    // Listen for map movements
    map.on('moveend', updateBounds);
    map.on('zoomend', updateBounds);

    return () => {
      clearTimeout(timer);
      map.off('moveend', updateBounds);
      map.off('zoomend', updateBounds);
    };
  }, [map, isLoaded]);

  return null;
}

// Convert bids to GeoJSON for clustering
function bidsToGeoJSON(bids: BidLocation[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: bids.map((bid, index) => ({
      type: 'Feature' as const,
      id: index,
      properties: {
        title: bid.title || 'Untitled Bid',
        agency: bid.agency || 'Unknown Agency',
        due_date: bid.due_date,
        estimated_budget: bid.estimated_budget,
        location: bid.location,
        pdf_url: bid.pdf_url,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [bid.longitude, bid.latitude],
      },
    })),
  };
}

function BidMapBase({
  initialCenter = [37.7749, -122.4194], // San Francisco [lat, lng]
  initialZoom = 9,
  bids = [],
}: BidMapProps) {
  // Use regular React state - not Tambo state to avoid loops
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  // Track selected bid for popup display (used with cluster layer)
  const [selectedBid, setSelectedBid] = useState<BidLocation | null>(null);

  // Get Tambo input to send messages
  const { setValue, submit } = useTamboThreadInput();

  const handleBoundsChange = useCallback((newBounds: MapBounds) => {
    setBounds(newBounds);
  }, []);

  const handleSearchArea = useCallback(async () => {
    if (bounds) {
      setIsSearching(true);
      // Set global state for context helper
      setGlobalMapSearch(bounds, true);
      // Send message to Tambo
      setValue(`Search for government bids in ${bounds.areaName}`);
      await submit();
      // Reset searching after a delay
      setTimeout(() => setIsSearching(false), 3000);
    }
  }, [bounds, setValue, submit]);

  const handleBidClick = useCallback((bid: BidLocation) => {
    // Set local state for popup display
    setSelectedBid(bid);
    // Set global selected bid for context helper
    setGlobalSelectedBid({
      title: bid.title || '',
      agency: bid.agency,
      due_date: bid.due_date,
      estimated_budget: bid.estimated_budget,
      location: bid.location,
      pdf_url: bid.pdf_url,
    });
  }, []);

  const handleAnalyzeBid = useCallback(async (bid: BidLocation) => {
    // Set global selected bid for context helper
    setGlobalSelectedBid({
      title: bid.title || '',
      agency: bid.agency,
      due_date: bid.due_date,
      estimated_budget: bid.estimated_budget,
      location: bid.location,
      pdf_url: bid.pdf_url,
    });
    // Send message to Tambo
    setValue(`Analyze this bid: "${bid.title}" from ${bid.agency}`);
    await submit();
  }, [setValue, submit]);

  // Convert [lat, lng] to [lng, lat] for MapLibre
  const mapCenter: [number, number] = [initialCenter[1], initialCenter[0]];

  // Convert bids to GeoJSON for clustering
  const geoJsonData = bidsToGeoJSON(bids);
  const hasBids = bids.length > 0;

  return (
    <div className="w-full h-full min-h-[400px] bg-card border border-border rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Find Bids by Location</h2>
          </div>
          {hasBids && (
            <span className="text-sm text-muted-foreground bg-primary/10 px-2 py-1 rounded-full">
              {bids.length} bid{bids.length !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {hasBids
            ? 'Click on markers to view bid details'
            : 'Pan and zoom to your service area, then click Search'}
        </p>
      </div>

      {/* Map */}
      <div className="relative flex-1 min-h-[300px]">
        <Map center={mapCenter} zoom={initialZoom}>
          <MapControls position="top-right" showZoom={true} showLocate={true} />
          <MapBoundsCapture onBoundsChange={handleBoundsChange} />

          {/* Show clusters when there are many bids */}
          {hasBids && bids.length > 5 && (
            <MapClusterLayer
              data={geoJsonData}
              clusterRadius={60}
              clusterMaxZoom={12}
              clusterColors={['#3b82f6', '#8b5cf6', '#ec4899']}
              clusterThresholds={[5, 15]}
              pointColor="#3b82f6"
              onPointClick={(feature, coords) => {
                const props = feature.properties;
                handleBidClick({
                  title: props?.title,
                  agency: props?.agency,
                  due_date: props?.due_date,
                  estimated_budget: props?.estimated_budget,
                  location: props?.location,
                  pdf_url: props?.pdf_url,
                  latitude: coords[1],
                  longitude: coords[0],
                });
              }}
            />
          )}

          {/* Popup for selected bid from cluster layer */}
          {selectedBid && bids.length > 5 && (
            <MapPopup
              longitude={selectedBid.longitude}
              latitude={selectedBid.latitude}
              onClose={() => setSelectedBid(null)}
              closeButton
              className="w-72"
            >
              <div className="space-y-2">
                <h3 className="font-semibold text-sm line-clamp-2">{selectedBid.title || 'Untitled Bid'}</h3>
                {selectedBid.agency && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="w-3 h-3" />
                    <span>{selectedBid.agency}</span>
                  </div>
                )}
                {selectedBid.estimated_budget && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <DollarSign className="w-3 h-3" />
                    <span>{selectedBid.estimated_budget}</span>
                  </div>
                )}
                {selectedBid.due_date && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>Due: {selectedBid.due_date}</span>
                  </div>
                )}
                <button
                  onClick={() => handleAnalyzeBid(selectedBid)}
                  className="w-full mt-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors"
                >
                  Analyze This Bid
                </button>
              </div>
            </MapPopup>
          )}

          {/* Show individual markers when there are few bids */}
          {hasBids && bids.length <= 5 && bids.map((bid, index) => (
            <MapMarker
              key={index}
              longitude={bid.longitude}
              latitude={bid.latitude}
            >
              <MarkerContent className="cursor-pointer">
                <div className="relative">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    <Building2 className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-primary" />
                </div>
              </MarkerContent>
              <MarkerPopup closeButton className="w-72">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm line-clamp-2">{bid.title || 'Untitled Bid'}</h3>
                  {bid.agency && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="w-3 h-3" />
                      <span>{bid.agency}</span>
                    </div>
                  )}
                  {bid.estimated_budget && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <DollarSign className="w-3 h-3" />
                      <span>{bid.estimated_budget}</span>
                    </div>
                  )}
                  {bid.due_date && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Due: {bid.due_date}</span>
                    </div>
                  )}
                  <button
                    onClick={() => handleAnalyzeBid(bid)}
                    className="w-full mt-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Analyze This Bid
                  </button>
                </div>
              </MarkerPopup>
            </MapMarker>
          ))}
        </Map>

        {/* Search button overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={handleSearchArea}
            disabled={isSearching || !bounds}
            className={`flex items-center gap-2 px-6 py-3 font-medium rounded-full shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              hasBids
                ? 'bg-card/90 backdrop-blur text-foreground border border-border hover:bg-card'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Searching {bounds?.areaName || 'area'}...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Search This Area
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info footer */}
      <div className="flex-shrink-0 p-3 bg-muted/20 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          {bounds ? (
            <>
              📍 {bounds.areaName} ({bounds.centerLat.toFixed(3)}, {bounds.centerLng.toFixed(3)})
            </>
          ) : (
            'Loading map...'
          )}
        </p>
      </div>
    </div>
  );
}

// Schema for bid locations on the map
const bidLocationSchema = z.object({
  title: z.string().optional(),
  agency: z.string().optional(),
  due_date: z.string().optional(),
  estimated_budget: z.string().optional(),
  location: z.string().optional(),
  pdf_url: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
});

// Props schema for interactable component - use array instead of tuple for flexibility
const BidMapPropsSchema = z.object({
  initialCenter: z.array(z.number()).length(2).optional().describe('Map center as [lat, lng]. Change this to pan the map.'),
  initialZoom: z.number().optional().describe('Zoom level (1-18). Higher = more zoomed in.'),
  bids: z.array(bidLocationSchema).optional().describe('IMPORTANT: Set this to the bids array from findBids tool response (data.bids). Each bid must have latitude and longitude. Markers will appear on the map.'),
});

// Interactable version - allows Tambo to update props via natural language
export const BidMap = withInteractable(BidMapBase, {
  componentName: 'BidMap',
  description: `Interactive map for finding government bids. After using findBids tool, UPDATE THIS COMPONENT by setting the "bids" prop to the bids array from the tool response. Each bid needs latitude and longitude fields. Example: set bids prop to [{title: "...", agency: "...", latitude: 37.78, longitude: -122.42}, ...]`,
  propsSchema: BidMapPropsSchema,
});

// Also export base component for direct use without interactable wrapper
export { BidMapBase };
