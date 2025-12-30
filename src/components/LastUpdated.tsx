'use client';

import { formatDateTime, formatRelativeTime } from '@/utils/formatters';

interface LastUpdatedProps {
  timestamp: string | null;
  className?: string;
}

export default function LastUpdated({ timestamp, className = '' }: LastUpdatedProps) {
  if (!timestamp) {
    return null;
  }

  return (
    <div className={`text-sm text-dark-text-muted ${className}`}>
      <span>Last updated: </span>
      <span title={formatDateTime(timestamp)}>
        {formatRelativeTime(timestamp)}
      </span>
    </div>
  );
}
