/**
 * GET /api/inventory
 * 
 * Returns current inventory levels grouped by dispensary and category.
 * 
 * Query params:
 * - dispensary: 'muv' | 'trulieve' | 'all' (default: 'all')
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { 
  DISPENSARY_IDS, 
  DISPENSARY_NAMES, 
  FOCUSED_COMPETITORS,
  THRESHOLDS,
  TRULIEVE_INVENTORY_CAP,
} from '@/lib/constants';
import type { DispensaryInventory, CategoryInventory } from '@/lib/types';

const DISPENSARY_MAP: Record<string, string> = {
  muv: DISPENSARY_IDS.MUV,
  trulieve: DISPENSARY_IDS.TRULIEVE,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dispensaryParam = searchParams.get('dispensary')?.toLowerCase() || 'all';

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

    const results: DispensaryInventory[] = [];

    for (const dispensaryId of dispensaryIds) {
      // Get location data
      const { data: locations, error: locError } = await supabase
        .from('competitor_product_locations')
        .select('product_id, location_id, available_quantity, stock_status, updated_at')
        .eq('dispensary_id', dispensaryId);

      if (locError) {
        console.error(`[Inventory] Error fetching locations for ${dispensaryId}:`, locError);
        continue;
      }

      // Get product data separately
      const { data: productData, error: prodError } = await supabase
        .from('competitor_products')
        .select('product_id, product_name, category, brand')
        .eq('dispensary_id', dispensaryId);

      if (prodError) {
        console.error(`[Inventory] Error fetching products for ${dispensaryId}:`, prodError);
        continue;
      }

      // Create product lookup map
      const productMap = new Map<string, { product_name: string; category: string | null; brand: string | null }>();
      for (const p of productData || []) {
        productMap.set(p.product_id, { 
          product_name: p.product_name, 
          category: p.category, 
          brand: p.brand 
        });
      }

      // Merge the data
      const products = (locations || []).map(loc => ({
        ...loc,
        competitor_products: productMap.get(loc.product_id) || { product_name: 'Unknown', category: null, brand: null }
      }));

      const error = null;

      if (error) {
        console.error(`[Inventory] Error fetching ${dispensaryId}:`, error);
        continue;
      }

      // Group by category
      const categoryMap = new Map<string, {
        total_quantity: number;
        products: Set<string>;
        out_of_stock: number;
        low_stock: number;
      }>();

      let totalQuantity = 0;
      let totalOutOfStock = 0;
      let totalLowStock = 0;
      let latestUpdate = '';

      for (const loc of products || []) {
        const category = (loc.competitor_products as any)?.category || 'Unknown';
        const qty = loc.available_quantity || 0;
        
        // Track latest update
        if (loc.updated_at > latestUpdate) {
          latestUpdate = loc.updated_at;
        }

        // Get or create category entry
        let catData = categoryMap.get(category);
        if (!catData) {
          catData = { total_quantity: 0, products: new Set(), out_of_stock: 0, low_stock: 0 };
          categoryMap.set(category, catData);
        }

        catData.products.add(loc.product_id);
        catData.total_quantity += qty;
        totalQuantity += qty;

        // Check stock status
        const isOutOfStock = qty === 0 || loc.stock_status === 'out_of_stock';
        const isLowStock = !isOutOfStock && qty > 0 && qty <= THRESHOLDS.LOW_STOCK;

        // For Trulieve, anything at cap (10) is not considered low stock
        const isTrulieve = dispensaryId === DISPENSARY_IDS.TRULIEVE;
        const atCap = isTrulieve && qty === TRULIEVE_INVENTORY_CAP;

        if (isOutOfStock) {
          catData.out_of_stock++;
          totalOutOfStock++;
        } else if (isLowStock && !atCap) {
          catData.low_stock++;
          totalLowStock++;
        }
      }

      // Convert to array
      const categories: CategoryInventory[] = [];
      for (const [category, data] of categoryMap) {
        categories.push({
          category,
          total_quantity: data.total_quantity,
          unique_products: data.products.size,
          out_of_stock_count: data.out_of_stock,
          low_stock_count: data.low_stock,
        });
      }

      // Sort categories by total quantity descending
      categories.sort((a, b) => b.total_quantity - a.total_quantity);

      results.push({
        dispensary_id: dispensaryId,
        dispensary_name: DISPENSARY_NAMES[dispensaryId] || 'Unknown',
        total_quantity: totalQuantity,
        total_products: new Set(products?.map(p => p.product_id)).size,
        out_of_stock_count: totalOutOfStock,
        low_stock_count: totalLowStock,
        categories,
        last_updated: latestUpdate,
      });
    }

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Inventory] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}