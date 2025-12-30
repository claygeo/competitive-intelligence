/**
 * Calculation utilities for inventory analysis
 */

import { THRESHOLDS, TRULIEVE_INVENTORY_CAP, DISPENSARY_IDS } from '@/lib/constants';

/**
 * Determine stock status based on quantity
 */
export function getStockStatus(
  quantity: number | null,
  dispensaryId?: string
): 'out' | 'critical' | 'low' | 'normal' | 'unknown' {
  if (quantity === null || quantity === undefined) {
    return 'unknown';
  }

  if (quantity <= THRESHOLDS.OUT_OF_STOCK) {
    return 'out';
  }

  if (quantity <= THRESHOLDS.CRITICAL_STOCK) {
    return 'critical';
  }

  if (quantity <= THRESHOLDS.LOW_STOCK) {
    return 'low';
  }

  return 'normal';
}

/**
 * Check if Trulieve quantity is at cap (meaning actual quantity is unknown but >= 10)
 */
export function isTrulieveAtCap(quantity: number | null, dispensaryId: string): boolean {
  return dispensaryId === DISPENSARY_IDS.TRULIEVE && quantity === TRULIEVE_INVENTORY_CAP;
}

/**
 * Get display text for inventory quantity
 */
export function getQuantityDisplay(
  quantity: number | null,
  dispensaryId: string
): string {
  if (quantity === null || quantity === undefined) {
    return 'Unknown';
  }

  if (isTrulieveAtCap(quantity, dispensaryId)) {
    return '10+';
  }

  return quantity.toLocaleString();
}

/**
 * Calculate depletion rate percentage
 */
export function calculateDepletionRate(
  startQuantity: number,
  endQuantity: number
): number {
  if (startQuantity === 0) {
    return endQuantity > 0 ? 100 : 0;
  }

  return ((endQuantity - startQuantity) / startQuantity) * 100;
}

/**
 * Determine trend direction from percentage change
 */
export function getTrend(percentChange: number): 'up' | 'down' | 'stable' {
  if (percentChange > 5) {
    return 'up';
  }
  if (percentChange < -5) {
    return 'down';
  }
  return 'stable';
}

/**
 * Calculate days until stock-out based on depletion rate
 */
export function calculateDaysUntilStockOut(
  currentQuantity: number,
  dailyDepletionRate: number
): number | null {
  if (dailyDepletionRate <= 0) {
    return null; // Not depleting
  }

  if (currentQuantity <= 0) {
    return 0; // Already out
  }

  return Math.ceil(currentQuantity / dailyDepletionRate);
}

/**
 * Calculate average daily depletion from historical data
 */
export function calculateAverageDailyDepletion(
  startQuantity: number,
  endQuantity: number,
  days: number
): number {
  if (days <= 0) {
    return 0;
  }

  return (startQuantity - endQuantity) / days;
}

/**
 * Score an opportunity (higher = better)
 */
export function scoreOpportunity(
  competitorStoresOut: number,
  totalCompetitorStores: number,
  curaleafQuantity: number,
  curaleafStoresWithStock: number
): number {
  // Percentage of competitor stores affected
  const competitorImpact = competitorStoresOut / totalCompetitorStores;
  
  // Curaleaf's ability to capture
  const curaleafCapacity = Math.min(curaleafQuantity / 100, 1); // Cap at 100 units
  const curaleafCoverage = curaleafStoresWithStock / 68; // Out of Curaleaf's 68 stores
  
  // Weighted score
  return (competitorImpact * 0.5) + (curaleafCapacity * 0.25) + (curaleafCoverage * 0.25);
}

/**
 * Group items by category and sum quantities
 */
export function groupByCategory<T extends { category: string | null; available_quantity: number | null }>(
  items: T[]
): Map<string, { items: T[]; totalQuantity: number }> {
  const grouped = new Map<string, { items: T[]; totalQuantity: number }>();

  for (const item of items) {
    const category = item.category || 'Unknown';
    const existing = grouped.get(category) || { items: [], totalQuantity: 0 };
    
    existing.items.push(item);
    existing.totalQuantity += item.available_quantity || 0;
    
    grouped.set(category, existing);
  }

  return grouped;
}

/**
 * Calculate percentage of stores with stock
 */
export function calculateStockCoverage(
  storesWithStock: number,
  totalStores: number
): number {
  if (totalStores === 0) return 0;
  return (storesWithStock / totalStores) * 100;
}
