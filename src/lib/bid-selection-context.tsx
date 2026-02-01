'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface Bid {
  title?: string;
  bid_number?: string;
  agency?: string;
  due_date?: string;
  estimated_budget?: string;
  trades?: string[];
  location?: string;
  pdf_url?: string;
  source_url?: string;
}

interface BidSelectionContextType {
  selectedBid: Bid | null;
  setSelectedBid: (bid: Bid | null) => void;
}

const BidSelectionContext = createContext<BidSelectionContextType | null>(null);

export function BidSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);

  return (
    <BidSelectionContext.Provider value={{ selectedBid, setSelectedBid }}>
      {children}
    </BidSelectionContext.Provider>
  );
}

export function useBidSelection() {
  const context = useContext(BidSelectionContext);
  if (!context) {
    throw new Error('useBidSelection must be used within BidSelectionProvider');
  }
  return context;
}

// Global getter for context helper (since context helpers can't use hooks)
let globalSelectedBid: Bid | null = null;

export function setGlobalSelectedBid(bid: Bid | null) {
  globalSelectedBid = bid;
}

export function getGlobalSelectedBid() {
  return globalSelectedBid;
}

// Map search state
interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
  centerLat: number;
  centerLng: number;
  areaName: string;
}

interface MapSearchState {
  bounds: MapBounds | null;
  searchTriggered: boolean;
}

let globalMapSearch: MapSearchState = {
  bounds: null,
  searchTriggered: false,
};

export function setGlobalMapSearch(bounds: MapBounds | null, triggered: boolean) {
  globalMapSearch = { bounds, searchTriggered: triggered };
}

export function getGlobalMapSearch() {
  return globalMapSearch;
}

export function clearMapSearchTrigger() {
  globalMapSearch.searchTriggered = false;
}
