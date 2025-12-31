/**
 * GET /api/stock-outs
 * 
 * Returns out-of-stock and low-stock items for competitors.
 * 
 * Query params:
 * - dispensary: 'muv' | 'trulieve' | 'all' (default: 'all')
 * - category: filter by category (optional)
 * - limit: max results (default: 100)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { 
  DISPENSARY_IDS, 
  DISPENSARY_NAMES,
  FOCUSED_COMPETITORS,
  THRESHOLDS,
  TRULIEVE_INVENTORY_CAP,
  STORE_COUNTS,
  API_CONFIG,
} from '@/lib/constants';
import type { StockOutItem, LowStockItem } from '@/lib/types';

const DISPENSARY_MAP: Record<string, string> = {
  muv: DISPENSARY_IDS.MUV,
  trulieve: DISPENSARY_IDS.TRULIEVE,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dispensaryParam = searchParams.get('dispensary')?.toLowerCase() || 'all';
    const categoryFilter = searchParams.get('category');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '100'),
      API_CONFIG.MAX_STOCK_OUT_RESULTS
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

    const stockOuts: StockOutItem[] = [];
    const lowStock: LowStockItem[] = [];

    for (const dispensaryId of dispensaryIds) {
      // Get location data
      const { data: locations, error: locError } = await supabase
        .from('competitor_product_locations')
        .select('dispensary_id, product_id, location_id, location_name, available_quantity, stock_status, regular_price, updated_at')
        .eq('dispensary_id', dispensaryId);

      if (locError) {
        console.error(`[StockOuts] Error fetching locations for ${dispensaryId}:`, locError);
        continue;
      }

      // Get product data separately
      let productQuery = supabase
        .from('competitor_products')
        .select('product_id, product_name, category, brand, size_display')
        .eq('dispensary_id', dispensaryId);
      
      if (categoryFilter) {
        productQuery = productQuery.eq('category', categoryFilter);
      }

      const { data: productData, error: prodError } = await productQuery;

      if (prodError) {
        console.error(`[StockOuts] Error fetching products for ${dispensaryId}:`, prodError);
        continue;
      }

      // Create product lookup map
      const productLookup = new Map<string, { product_name: string; category: string | null; brand: string | null; size_display: string | null }>();
      for (const p of productData || []) {
        productLookup.set(p.product_id, { 
          product_name: p.product_name, 
          category: p.category, 
          brand: p.brand,
          size_display: p.size_display
        });
      }

      // Filter locations to only those with matching products (handles category filter)
      const filteredLocations = (locations || []).filter(loc => productLookup.has(loc.product_id));

      // Group by product
      const productMap = new Map<string, {
        product_id: string;
        product_name: string;
        category: string | null;
        brand: string | null;
        size_display: string | null;
        regular_price: number | null;
        out_locations: string[];
        low_locations: string[];
        total_quantity: number;
        last_seen: string;
      }>();

      for (const loc of filteredLocations) {
        const productId = loc.product_id;
        const product = productLookup.get(productId);
        const qty = loc.available_quantity || 0;
        
        let productData = productMap.get(productId);
        if (!productData) {
          productData = {
            product_id: productId,
            product_name: product?.product_name || 'Unknown',
            category: product?.category || null,
            brand: product?.brand || null,
            size_display: product?.size_display || null,
            regular_price: loc.regular_price,
            out_locations: [],
            low_locations: [],
            total_quantity: 0,
            last_seen: loc.updated_at,
          };
          productMap.set(productId, productData);
        }

        productData.total_quantity += qty;
        if (loc.updated_at > productData.last_seen) {
          productData.last_seen = loc.updated_at;
        }

        const isOutOfStock = qty === 0 || loc.stock_status === 'out_of_stock';
        
        // For Trulieve, <10 is low stock (since 10 is the cap)
        const isTrulieve = dispensaryId === DISPENSARY_IDS.TRULIEVE;
        const isLowStock = !isOutOfStock && qty > 0 && qty < (isTrulieve ? TRULIEVE_INVENTORY_CAP : THRESHOLDS.LOW_STOCK);

        if (isOutOfStock) {
          productData.out_locations.push(loc.location_name);
        } else if (isLowStock) {
          productData.low_locations.push(loc.location_name);
        }
      }

      // Convert to output format
      const totalStores = STORE_COUNTS[dispensaryId] || 100;

      for (const [productId, data] of productMap) {
        // Products with stock-outs
        if (data.out_locations.length > 0) {
          stockOuts.push({
            dispensary_id: dispensaryId,
            product_id: productId,
            product_name: data.product_name,
            category: data.category,
            brand: data.brand,
            size_display: data.size_display,
            stores_out: data.out_locations.length,
            total_stores: totalStores,
            current_quantity: data.total_quantity,
            regular_price: data.regular_price,
            last_seen_date: data.last_seen,
          });
        }

        // Products with low stock
        if (data.low_locations.length > 0) {
          lowStock.push({
            dispensary_id: dispensaryId,
            product_id: productId,
            product_name: data.product_name,
            category: data.category,
            brand: data.brand,
            size_display: data.size_display,
            available_quantity: data.total_quantity,
            stores_affected: data.low_locations.length,
            location_names: data.low_locations.slice(0, 5), // Limit location names
          });
        }
      }
    }

    // Sort by stores affected (most first)
    stockOuts.sort((a, b) => b.stores_out - a.stores_out);
    lowStock.sort((a, b) => b.stores_affected - a.stores_affected);

    return NextResponse.json({
      success: true,
      stockOuts: stockOuts.slice(0, limit),
      lowStock: lowStock.slice(0, limit),
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[StockOuts] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}