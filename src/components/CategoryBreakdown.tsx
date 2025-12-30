'use client';

import type { CategoryInventory } from '@/lib/types';
import { formatNumber } from '@/utils/formatters';

interface CategoryBreakdownProps {
  categories: CategoryInventory[];
  accentColor: string;
  isTrulieve?: boolean;
}

const COLOR_MAP: Record<string, string> = {
  purple: 'bg-purple-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  gray: 'bg-gray-500',
};

export default function CategoryBreakdown({ 
  categories, 
  accentColor,
  isTrulieve = false,
}: CategoryBreakdownProps) {
  if (!categories || categories.length === 0) {
    return (
      <p className="text-sm text-dark-text-muted text-center py-4">
        No category data available
      </p>
    );
  }

  // Calculate max for percentage bars
  const maxQuantity = Math.max(...categories.map(c => c.total_quantity));

  return (
    <div className="space-y-2">
      {categories.map(category => {
        const percentage = maxQuantity > 0 
          ? (category.total_quantity / maxQuantity) * 100 
          : 0;
        
        const hasIssues = category.out_of_stock_count > 0 || category.low_stock_count > 0;

        return (
          <div key={category.category} className="group">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-dark-text truncate">
                {category.category}
              </span>
              <div className="flex items-center gap-3">
                {hasIssues && (
                  <span className="text-xs text-dark-text-muted">
                    {category.out_of_stock_count > 0 && (
                      <span className="text-red-400 mr-2">
                        {category.out_of_stock_count} out
                      </span>
                    )}
                    {category.low_stock_count > 0 && (
                      <span className="text-yellow-400">
                        {category.low_stock_count} low
                      </span>
                    )}
                  </span>
                )}
                <span className="text-dark-text font-medium min-w-[60px] text-right">
                  {isTrulieve && category.total_quantity > 0 ? (
                    <span title="May be higher due to display cap">
                      {formatNumber(category.total_quantity)}
                    </span>
                  ) : (
                    formatNumber(category.total_quantity)
                  )}
                </span>
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className={`progress-fill ${COLOR_MAP[accentColor] || 'bg-gray-500'} opacity-70 group-hover:opacity-100`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
