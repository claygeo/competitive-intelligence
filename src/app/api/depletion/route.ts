/**
 * GET /api/depletion
 * 
 * Returns depletion rates by category from historical snapshots.
 * 
 * Query params:
 * - dispensary: 'muv' | 'trulieve' | 'all' (default: 'all')
 * - days: number of days to analyze (default: 7)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { 
  DISPENSARY_IDS, 
  DISPENSARY_NAMES,
  FOCUSED_COMPETITORS,
  API_CONFIG,
} from '@/lib/constants';
import type { DepletionSummary, CategoryDepletion } from '@/lib/types';
import { getTrend } from '@/utils/calculations';

const DISPENSARY_MAP: Record<string, string> = {
  muv: DISPENSARY_IDS.MUV,
  trulieve: DISPENSARY_IDS.TRULIEVE,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dispensaryParam = searchParams.get('dispensary')?.toLowerCase() || 'all';
    const days = Math.min(
      Math.max(parseInt(searchParams.get('days') || '7'), 1),
      30 // Max 30 days
    );

    // Determine which dispensaries to query
    let dispensaryIds: string[];
    if (dispensaryParam === 'all') {
      dispensaryIds = [...FOCUSED_COMPETITORS];
    } else if (DISPENSARY_MAP[dispensaryParam]) {
      dispensaryIds = [DISPENSARY_MAP[dispensaryParam]];
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid dispensary. Use: muv, trulieve, or all' },
        { status: 400 }
      );
    }

    const results: DepletionSummary[] = [];

    // Calculate date range
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    for (const dispensaryId of dispensaryIds) {
      // Get start snapshot totals by category
      const { data: startData, error: startError } = await supabase
        .from('inventory_snapshots')
        .select('category, available_quantity')
        .eq('dispensary_id', dispensaryId)
        .eq('snapshot_date', startDate);

      if (startError) {
        console.error(`[Depletion] Error fetching start data for ${dispensaryId}:`, startError);
        continue;
      }

      // Get end snapshot totals by category
      const { data: endData, error: endError } = await supabase
        .from('inventory_snapshots')
        .select('category, available_quantity')
        .eq('dispensary_id', dispensaryId)
        .eq('snapshot_date', endDate);

      if (endError) {
        console.error(`[Depletion] Error fetching end data for ${dispensaryId}:`, endError);
        continue;
      }

      // Aggregate by category
      const startTotals = new Map<string, number>();
      const endTotals = new Map<string, number>();

      for (const row of startData || []) {
        const cat = row.category || 'Unknown';
        startTotals.set(cat, (startTotals.get(cat) || 0) + (row.available_quantity || 0));
      }

      for (const row of endData || []) {
        const cat = row.category || 'Unknown';
        endTotals.set(cat, (endTotals.get(cat) || 0) + (row.available_quantity || 0));
      }

      // Calculate depletion for each category
      const categories: CategoryDepletion[] = [];
      const allCategories = new Set([...startTotals.keys(), ...endTotals.keys()]);

      let overallStart = 0;
      let overallEnd = 0;

      for (const category of allCategories) {
        const startQty = startTotals.get(category) || 0;
        const endQty = endTotals.get(category) || 0;
        const change = endQty - startQty;
        const percentChange = startQty > 0 
          ? ((change / startQty) * 100)
          : (endQty > 0 ? 100 : 0);

        overallStart += startQty;
        overallEnd += endQty;

        categories.push({
          category,
          start_quantity: startQty,
          end_quantity: endQty,
          quantity_change: change,
          percent_change: Math.round(percentChange * 10) / 10,
          trend: getTrend(percentChange),
        });
      }

      // Sort by percent change (most depleted first)
      categories.sort((a, b) => a.percent_change - b.percent_change);

      // Calculate overall change
      const overallChange = overallStart > 0
        ? ((overallEnd - overallStart) / overallStart) * 100
        : 0;

      results.push({
        dispensary_id: dispensaryId,
        dispensary_name: DISPENSARY_NAMES[dispensaryId] || 'Unknown',
        period_days: days,
        categories,
        overall_change: Math.round(overallChange * 10) / 10,
      });
    }

    // Check if we have any snapshot data
    const hasData = results.some(r => r.categories.length > 0);
    
    if (!hasData) {
      return NextResponse.json({
        success: true,
        data: results,
        period_days: days,
        message: 'No historical snapshot data available. Run snapshots after each scrape to enable depletion tracking.',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: results,
      period_days: days,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Depletion] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
