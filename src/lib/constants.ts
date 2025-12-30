/**
 * Constants for Competitive Intelligence Dashboard
 */

// Dispensary IDs from your database
export const DISPENSARY_IDS = {
  CURALEAF: '971a1a5c-5c44-4a36-bf6a-f50c86a10a5d',
  MUV: 'a362214f-2a99-486e-b3c7-810fcfc1c25d',
  TRULIEVE: 'c9a02acb-3f35-4657-b7af-3db95fd2dc83',
  AYR: 'ff3a8196-b84c-4b1d-b29c-267be0520092',
} as const;

// Display names
export const DISPENSARY_NAMES: Record<string, string> = {
  [DISPENSARY_IDS.CURALEAF]: 'Curaleaf',
  [DISPENSARY_IDS.MUV]: 'MUV',
  [DISPENSARY_IDS.TRULIEVE]: 'Trulieve',
  [DISPENSARY_IDS.AYR]: 'AYR',
};

// Colors for UI
export const DISPENSARY_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  [DISPENSARY_IDS.CURALEAF]: {
    bg: 'bg-green-900/20',
    text: 'text-green-400',
    border: 'border-green-800/30',
    accent: 'green',
  },
  [DISPENSARY_IDS.MUV]: {
    bg: 'bg-purple-900/20',
    text: 'text-purple-400',
    border: 'border-purple-800/30',
    accent: 'purple',
  },
  [DISPENSARY_IDS.TRULIEVE]: {
    bg: 'bg-red-900/20',
    text: 'text-red-400',
    border: 'border-red-800/30',
    accent: 'red',
  },
  [DISPENSARY_IDS.AYR]: {
    bg: 'bg-amber-900/20',
    text: 'text-amber-400',
    border: 'border-amber-800/30',
    accent: 'amber',
  },
};

// Store counts (approximate)
export const STORE_COUNTS: Record<string, number> = {
  [DISPENSARY_IDS.CURALEAF]: 68,
  [DISPENSARY_IDS.MUV]: 81,
  [DISPENSARY_IDS.TRULIEVE]: 150,
  [DISPENSARY_IDS.AYR]: 48,
};

// Inventory thresholds
export const THRESHOLDS = {
  LOW_STOCK: 10,       // Below this = low stock warning
  CRITICAL_STOCK: 5,   // Below this = critical
  OUT_OF_STOCK: 0,     // Zero or null = out of stock
} as const;

// Trulieve caps inventory display at 10
export const TRULIEVE_INVENTORY_CAP = 10;

// Standard categories for grouping
export const STANDARD_CATEGORIES = [
  'Flower',
  'Vapes',
  'Concentrates',
  'Edibles',
  'Pre-Rolls',
  'Oral',
  'Topicals',
] as const;

// Focused competitors (per pricing team feedback)
export const FOCUSED_COMPETITORS = [
  DISPENSARY_IDS.MUV,
  DISPENSARY_IDS.TRULIEVE,
] as const;

// API configuration
export const API_CONFIG = {
  SNAPSHOT_BATCH_SIZE: 500,
  DEPLETION_DEFAULT_DAYS: 7,
  MAX_STOCK_OUT_RESULTS: 100,
} as const;
