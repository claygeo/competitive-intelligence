'use client';

import { DISPENSARY_NAMES, DISPENSARY_COLORS, DISPENSARY_IDS } from '@/lib/constants';
import type { StockOutItem } from '@/lib/types';
import { formatNumber, truncate } from '@/utils/formatters';

interface OpportunitiesPanelProps {
  stockOuts: StockOutItem[];
  isLoading: boolean;
}

export default function OpportunitiesPanel({ stockOuts, isLoading }: OpportunitiesPanelProps) {
  if (isLoading) {
    return (
      <div className="card h-full">
        <div className="card-header">
          <div className="h-6 w-32 bg-dark-border rounded animate-pulse" />
        </div>
        <div className="card-body space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-dark-border/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Group stock-outs by dispensary
  const muvOuts = stockOuts.filter(s => s.dispensary_id === DISPENSARY_IDS.MUV);
  const truOuts = stockOuts.filter(s => s.dispensary_id === DISPENSARY_IDS.TRULIEVE);

  // Get top opportunities (products out at many stores)
  const topMuvOuts = muvOuts
    .sort((a, b) => (b.stores_out / b.total_stores) - (a.stores_out / a.total_stores))
    .slice(0, 5);
  
  const topTruOuts = truOuts
    .sort((a, b) => (b.stores_out / b.total_stores) - (a.stores_out / a.total_stores))
    .slice(0, 5);

  const hasOpportunities = topMuvOuts.length > 0 || topTruOuts.length > 0;

  return (
    <div className="card h-full border-green-800/30">
      <div className="card-header bg-green-900/10">
        <h2 className="text-lg font-semibold text-green-400">Opportunities</h2>
        <p className="text-sm text-dark-text-muted mt-1">
          Competitor stock-outs to capitalize on
        </p>
      </div>

      <div className="card-body">
        {!hasOpportunities ? (
          <p className="text-sm text-dark-text-muted text-center py-8">
            No significant competitor stock-outs detected
          </p>
        ) : (
          <div className="space-y-4">
            {/* MUV Opportunities */}
            {topMuvOuts.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-purple-400 mb-2">
                  MUV Stock-Outs
                </h3>
                <div className="space-y-2">
                  {topMuvOuts.map((item, idx) => (
                    <OpportunityItem key={`muv-${idx}`} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Trulieve Opportunities */}
            {topTruOuts.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-red-400 mb-2">
                  Trulieve Low/Out
                </h3>
                <div className="space-y-2">
                  {topTruOuts.map((item, idx) => (
                    <OpportunityItem key={`tru-${idx}`} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Action note */}
            <div className="mt-4 p-3 bg-green-900/10 rounded border border-green-800/30">
              <p className="text-xs text-dark-text-muted">
                Consider targeted promotions or marketing in areas where competitors are out of stock on popular products.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OpportunityItem({ item }: { item: StockOutItem }) {
  const percentOut = Math.round((item.stores_out / item.total_stores) * 100);
  
  return (
    <div className="p-2 rounded bg-dark-card/30 border border-dark-border/50">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-dark-text font-medium truncate">
            {truncate(item.product_name, 35)}
          </p>
          <p className="text-xs text-dark-text-muted">
            {item.category || 'Unknown'} • {item.size_display || ''}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-medium text-red-400">
            {item.stores_out}/{item.total_stores}
          </p>
          <p className="text-xs text-dark-text-muted">
            {percentOut}% out
          </p>
        </div>
      </div>
    </div>
  );
}
