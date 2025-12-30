'use client';

import { DISPENSARY_COLORS, DISPENSARY_IDS, TRULIEVE_INVENTORY_CAP } from '@/lib/constants';
import type { DispensaryInventory } from '@/lib/types';
import { formatNumber } from '@/utils/formatters';
import CategoryBreakdown from './CategoryBreakdown';

interface InventoryPanelProps {
  inventory: DispensaryInventory | null;
  isLoading: boolean;
}

export default function InventoryPanel({ inventory, isLoading }: InventoryPanelProps) {
  if (isLoading) {
    return (
      <div className="card h-full">
        <div className="card-header">
          <div className="h-6 w-32 bg-dark-border rounded animate-pulse" />
        </div>
        <div className="card-body space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-dark-border/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="card h-full">
        <div className="card-body flex items-center justify-center">
          <p className="text-dark-text-muted">No inventory data available</p>
        </div>
      </div>
    );
  }

  const colors = DISPENSARY_COLORS[inventory.dispensary_id] || {
    bg: 'bg-gray-900/20',
    text: 'text-gray-400',
    border: 'border-gray-800/30',
    accent: 'gray',
  };

  const isTrulieve = inventory.dispensary_id === DISPENSARY_IDS.TRULIEVE;

  return (
    <div className={`card h-full ${colors.border}`}>
      <div className={`card-header ${colors.bg}`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-semibold ${colors.text}`}>
            {inventory.dispensary_name}
          </h2>
          <div className="text-right">
            <p className="text-sm text-dark-text-muted">Total Inventory</p>
            <p className="text-xl font-bold text-dark-text">
              {isTrulieve ? (
                <span title="Trulieve caps display at 10 per location">
                  {formatNumber(inventory.total_quantity)}*
                </span>
              ) : (
                formatNumber(inventory.total_quantity)
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="card-body">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-dark-card/50 rounded p-2 text-center">
            <p className="text-xs text-dark-text-muted">Products</p>
            <p className="text-lg font-semibold text-dark-text">
              {formatNumber(inventory.total_products)}
            </p>
          </div>
          <div className="bg-red-900/20 rounded p-2 text-center">
            <p className="text-xs text-dark-text-muted">Out of Stock</p>
            <p className="text-lg font-semibold text-red-400">
              {formatNumber(inventory.out_of_stock_count)}
            </p>
          </div>
          <div className="bg-yellow-900/20 rounded p-2 text-center">
            <p className="text-xs text-dark-text-muted">
              {isTrulieve ? 'Low (<10)' : 'Low Stock'}
            </p>
            <p className="text-lg font-semibold text-yellow-400">
              {formatNumber(inventory.low_stock_count)}
            </p>
          </div>
        </div>

        {/* Trulieve note */}
        {isTrulieve && (
          <div className="mb-4 p-2 bg-dark-card/30 rounded text-xs text-dark-text-muted">
            * Trulieve caps inventory display at 10. Values shown may be higher.
          </div>
        )}

        {/* Category breakdown */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-dark-text-muted">By Category</h3>
          <CategoryBreakdown 
            categories={inventory.categories} 
            accentColor={colors.accent}
            isTrulieve={isTrulieve}
          />
        </div>
      </div>
    </div>
  );
}
