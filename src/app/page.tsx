'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import InventoryPanel from '@/components/InventoryPanel';
import OpportunitiesPanel from '@/components/OpportunitiesPanel';
import StockOutTable from '@/components/StockOutTable';
import DepletionTracker from '@/components/DepletionTracker';
import LoadingSpinner from '@/components/LoadingSpinner';
import { DISPENSARY_IDS } from '@/lib/constants';
import type { 
  DispensaryInventory, 
  StockOutItem, 
  LowStockItem,
  DepletionSummary,
} from '@/lib/types';

export default function DashboardPage() {
  // State
  const [muvInventory, setMuvInventory] = useState<DispensaryInventory | null>(null);
  const [trulieveInventory, setTrulieveInventory] = useState<DispensaryInventory | null>(null);
  const [stockOuts, setStockOuts] = useState<StockOutItem[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [depletion, setDepletion] = useState<DepletionSummary[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch inventory data
      const inventoryRes = await fetch('/api/inventory?dispensary=all');
      const inventoryData = await inventoryRes.json();

      if (inventoryData.success) {
        const muv = inventoryData.data.find(
          (d: DispensaryInventory) => d.dispensary_id === DISPENSARY_IDS.MUV
        );
        const tru = inventoryData.data.find(
          (d: DispensaryInventory) => d.dispensary_id === DISPENSARY_IDS.TRULIEVE
        );
        
        setMuvInventory(muv || null);
        setTrulieveInventory(tru || null);
        setLastUpdated(inventoryData.timestamp);
      }

      // Fetch stock-outs
      const stockOutsRes = await fetch('/api/stock-outs?dispensary=all&limit=100');
      const stockOutsData = await stockOutsRes.json();

      if (stockOutsData.success) {
        setStockOuts(stockOutsData.stockOuts || []);
        setLowStock(stockOutsData.lowStock || []);
      }

      // Fetch depletion data
      const depletionRes = await fetch('/api/depletion?dispensary=all&days=7');
      const depletionData = await depletionRes.json();

      if (depletionData.success) {
        setDepletion(depletionData.data || []);
      }

    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header 
        lastUpdated={lastUpdated}
        onRefresh={fetchData}
        isLoading={isLoading}
      />

      <main className="container mx-auto px-4 sm:px-6 py-6">
        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Top row: MUV, Trulieve, Opportunities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <InventoryPanel 
            inventory={muvInventory}
            isLoading={isLoading}
          />
          
          <InventoryPanel 
            inventory={trulieveInventory}
            isLoading={isLoading}
          />
          
          <OpportunitiesPanel 
            stockOuts={stockOuts}
            isLoading={isLoading}
          />
        </div>

        {/* Middle row: Depletion Tracker */}
        <div className="mb-6">
          <DepletionTracker 
            depletion={depletion}
            isLoading={isLoading}
            periodDays={7}
          />
        </div>

        {/* Bottom row: Stock-out details */}
        <div>
          <StockOutTable 
            stockOuts={stockOuts}
            lowStock={lowStock}
            isLoading={isLoading}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-border py-4 mt-8">
        <div className="container mx-auto px-4 sm:px-6">
          <p className="text-xs text-dark-text-muted text-center">
            Competitive Intelligence Dashboard • Data updates after each scraper run
          </p>
        </div>
      </footer>
    </div>
  );
}
