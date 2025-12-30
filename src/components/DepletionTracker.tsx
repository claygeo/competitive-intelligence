'use client';

import { DISPENSARY_COLORS } from '@/lib/constants';
import type { DepletionSummary } from '@/lib/types';
import { formatNumber, formatPercentChange, getTrendArrow, getTrendColor } from '@/utils/formatters';

interface DepletionTrackerProps {
  depletion: DepletionSummary[];
  isLoading: boolean;
  periodDays: number;
}

export default function DepletionTracker({ depletion, isLoading, periodDays }: DepletionTrackerProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="h-6 w-48 bg-dark-border rounded animate-pulse" />
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="space-y-2">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-8 bg-dark-border/50 rounded animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasData = depletion.some(d => d.categories.length > 0);

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-dark-text">Inventory Velocity</h2>
            <p className="text-sm text-dark-text-muted mt-1">
              {periodDays}-day inventory change by category
            </p>
          </div>
        </div>
      </div>

      <div className="card-body">
        {!hasData ? (
          <div className="text-center py-8">
            <p className="text-sm text-dark-text-muted mb-2">
              No historical data available
            </p>
            <p className="text-xs text-dark-text-muted">
              Run the snapshot API after each scrape to enable depletion tracking
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {depletion.map(dispensary => {
              const colors = DISPENSARY_COLORS[dispensary.dispensary_id];
              
              return (
                <div key={dispensary.dispensary_id}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`font-medium ${colors?.text || 'text-dark-text'}`}>
                      {dispensary.dispensary_name}
                    </h3>
                    <span className={`text-sm ${getTrendColor(dispensary.overall_change < -5 ? 'down' : dispensary.overall_change > 5 ? 'up' : 'stable')}`}>
                      {formatPercentChange(dispensary.overall_change)} overall
                    </span>
                  </div>

                  <div className="space-y-2">
                    {dispensary.categories.slice(0, 6).map(cat => (
                      <div 
                        key={cat.category}
                        className="flex items-center justify-between py-1.5 px-2 rounded bg-dark-card/30"
                      >
                        <span className="text-sm text-dark-text">
                          {cat.category}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-dark-text-muted">
                            {formatNumber(cat.start_quantity)} → {formatNumber(cat.end_quantity)}
                          </span>
                          <span className={`text-sm font-medium ${getTrendColor(cat.trend)} min-w-[60px] text-right`}>
                            {getTrendArrow(cat.trend)} {formatPercentChange(cat.percent_change)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
