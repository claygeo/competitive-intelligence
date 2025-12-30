'use client';

import { formatRelativeTime } from '@/utils/formatters';

interface HeaderProps {
  lastUpdated: string | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function Header({ lastUpdated, onRefresh, isLoading }: HeaderProps) {
  return (
    <header className="bg-dark-card/50 border-b border-dark-border">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-dark-text">
              Competitive Intelligence
            </h1>
            <p className="text-sm text-dark-text-muted mt-0.5">
              MUV and Trulieve inventory tracking
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-sm text-dark-text-muted">
                Updated {formatRelativeTime(lastUpdated)}
              </span>
            )}
            
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg
                border border-dark-border
                ${isLoading 
                  ? 'bg-dark-card text-dark-text-muted cursor-not-allowed' 
                  : 'bg-dark-card hover:bg-dark-border text-dark-text'
                }
                transition-colors
              `}
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
