/**
 * POST /api/snapshot
 * 
 * Triggers an inventory snapshot after a scrape completes.
 * Copies current inventory data from competitor_product_locations to inventory_snapshots.
 * 
 * Body: { dispensary: 'muv' | 'trulieve' | 'curaleaf' | 'ayr' }
 * Headers: x-api-key (optional, for production security)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { DISPENSARY_IDS, API_CONFIG } from '@/lib/constants';

const DISPENSARY_MAP: Record<string, string> = {
  muv: DISPENSARY_IDS.MUV,
  trulieve: DISPENSARY_IDS.TRULIEVE,
  curaleaf: DISPENSARY_IDS.CURALEAF,
  ayr: DISPENSARY_IDS.AYR,
};

export async function POST(request: NextRequest) {
  try {
    // Optional API key check
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.SNAPSHOT_API_KEY;
    
    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse body
    const body = await request.json();
    const dispensaryKey = body.dispensary?.toLowerCase();

    if (!dispensaryKey || !DISPENSARY_MAP[dispensaryKey]) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid dispensary. Use: muv, trulieve, curaleaf, or ayr' 
        },
        { status: 400 }
      );
    }

    const dispensaryId = DISPENSARY_MAP[dispensaryKey];
    const today = new Date().toISOString().split('T')[0];

    console.log(`[Snapshot] Starting snapshot for ${dispensaryKey} (${dispensaryId})`);

    // Delete existing snapshots for today (to avoid duplicates on re-run)
    const { error: deleteError } = await supabaseAdmin
      .from('inventory_snapshots')
      .delete()
      .eq('dispensary_id', dispensaryId)
      .eq('snapshot_date', today);

    if (deleteError) {
      console.error('[Snapshot] Error deleting existing snapshots:', deleteError);
    }

    // Fetch current inventory from competitor_product_locations
    let allLocations: any[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const from = page * 1000;
      const to = from + 999;

      const { data, error } = await supabaseAdmin
        .from('competitor_product_locations')
        .select(`
          dispensary_id,
          product_id,
          location_id,
          location_name,
          available_quantity,
          stock_status,
          current_price,
          regular_price,
          competitor_products!inner (
            product_name,
            category,
            brand,
            size_display
          )
        `)
        .eq('dispensary_id', dispensaryId)
        .range(from, to);

      if (error) {
        console.error('[Snapshot] Error fetching locations:', error);
        return NextResponse.json(
          { success: false, error: `Database error: ${error.message}` },
          { status: 500 }
        );
      }

      if (data && data.length > 0) {
        allLocations = allLocations.concat(data);
        page++;
        hasMore = data.length === 1000;
      } else {
        hasMore = false;
      }
    }

    console.log(`[Snapshot] Found ${allLocations.length} location records`);

    if (allLocations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No inventory data found for dispensary',
        records_created: 0,
        dispensary: dispensaryKey,
        timestamp: new Date().toISOString(),
      });
    }

    // Transform to snapshot records
    const snapshots = allLocations.map((loc: any) => ({
      dispensary_id: loc.dispensary_id,
      product_id: loc.product_id,
      location_id: loc.location_id,
      product_name: loc.competitor_products?.product_name || 'Unknown',
      category: loc.competitor_products?.category || null,
      brand: loc.competitor_products?.brand || null,
      size_display: loc.competitor_products?.size_display || null,
      available_quantity: loc.available_quantity,
      stock_status: loc.stock_status,
      regular_price: loc.regular_price,
      current_price: loc.current_price,
      snapshot_date: today,
    }));

    // Insert in batches
    let totalInserted = 0;
    const batchSize = API_CONFIG.SNAPSHOT_BATCH_SIZE;

    for (let i = 0; i < snapshots.length; i += batchSize) {
      const batch = snapshots.slice(i, i + batchSize);
      
      const { error: insertError, count } = await supabaseAdmin
        .from('inventory_snapshots')
        .upsert(batch, {
          onConflict: 'dispensary_id,product_id,location_id,snapshot_date',
        });

      if (insertError) {
        console.error(`[Snapshot] Batch ${Math.floor(i / batchSize) + 1} error:`, insertError);
      } else {
        totalInserted += batch.length;
      }
    }

    console.log(`[Snapshot] Created ${totalInserted} snapshot records for ${dispensaryKey}`);

    return NextResponse.json({
      success: true,
      message: `Snapshot created for ${dispensaryKey}`,
      records_created: totalInserted,
      dispensary: dispensaryKey,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Snapshot] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
