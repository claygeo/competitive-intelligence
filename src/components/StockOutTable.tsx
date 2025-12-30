'use client';

import { DISPENSARY_NAMES, DISPENSARY_COLORS } from '@/lib/constants';
import type { StockOutItem, LowStockItem } from '@/lib/types';
import { formatNumber, formatCurrency, truncate } from '@/utils/formatters';

interface StockOutTableProps {
  stockOuts: StockOutItem[];
  lowStock: LowStockItem[];
  isLoading: boolean;
}

export default function StockOutTable({ stockOuts, lowStock, isLoading }: StockOutTableProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="h-6 w-48 bg-dark-border rounded animate-pulse" />
        </div>
        <div className="card-body space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 bg-dark-border/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const hasData = stockOuts.length > 0 || lowStock.length > 0;

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-semibold text-dark-text">Stock Alerts</h2>
        <p className="text-sm text-dark-text-muted mt-1">
          Out-of-stock and low inventory items
        </p>
      </div>

      <div className="card-body">
        {!hasData ? (
          <p className="text-sm text-dark-text-muted text-center py-8">
            No stock alerts at this time
          </p>
        ) : (
          <div className="space-y-6">
            {/* Out of Stock Section */}
            {stockOuts.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                  <span className="status-dot status-out" />
                  Out of Stock ({stockOuts.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Dispensary</th>
                        <th className="text-right">Stores Out</th>
                        <th className="text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockOuts.slice(0, 15).map((item, idx) => {
                        const colors = DISPENSARY_COLORS[item.dispensary_id];
                        return (
                          <tr key={`out-${idx}`}>
                            <td>
                              <div>
                                <p className="text-dark-text font-medium">
                                  {truncate(item.product_name, 40)}
                                </p>
                                {item.brand && (
                                  <p className="text-xs text-dark-text-muted">{item.brand}</p>
                                )}
                              </div>
                            </td>
                            <td className="text-dark-text-muted">
                              {item.category || '—'}
                            </td>
                            <td>
                              <span className={colors?.text || 'text-dark-text'}>
                                {DISPENSARY_NAMES[item.dispensary_id] || 'Unknown'}
                              </span>
                            </td>
                            <td className="text-right">
                              <span className="text-red-400 font-medium">
                                {item.stores_out}/{item.total_stores}
                              </span>
                            </td>
                            <td className="text-right text-dark-text-muted">
                              {formatCurrency(item.regular_price)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {stockOuts.length > 15 && (
                  <p className="text-xs text-dark-text-muted mt-2 text-center">
                    Showing 15 of {stockOuts.length} items
                  </p>
                )}
              </div>
            )}

            {/* Low Stock Section */}
            {lowStock.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-yellow-400 mb-2 flex items-center gap-2">
                  <span className="status-dot status-low" />
                  Low Stock ({lowStock.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Dispensary</th>
                        <th className="text-right">Quantity</th>
                        <th className="text-right">Stores</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStock.slice(0, 10).map((item, idx) => {
                        const colors = DISPENSARY_COLORS[item.dispensary_id];
                        return (
                          <tr key={`low-${idx}`}>
                            <td>
                              <div>
                                <p className="text-dark-text font-medium">
                                  {truncate(item.product_name, 40)}
                                </p>
                                {item.brand && (
                                  <p className="text-xs text-dark-text-muted">{item.brand}</p>
                                )}
                              </div>
                            </td>
                            <td className="text-dark-text-muted">
                              {item.category || '—'}
                            </td>
                            <td>
                              <span className={colors?.text || 'text-dark-text'}>
                                {DISPENSARY_NAMES[item.dispensary_id] || 'Unknown'}
                              </span>
                            </td>
                            <td className="text-right">
                              <span className="text-yellow-400 font-medium">
                                {formatNumber(item.available_quantity)}
                              </span>
                            </td>
                            <td className="text-right text-dark-text-muted">
                              {item.stores_affected}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
