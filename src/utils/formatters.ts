/**
 * Formatting utilities
 */

/**
 * Format number with commas
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return value.toLocaleString();
}

/**
 * Format currency
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return `$${value.toFixed(2)}`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format percentage with sign
 */
export function formatPercentChange(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined) {
    return '—';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return '—';
  }
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format datetime for display
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) {
    return '—';
  }
  
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) {
    return '—';
  }
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'Just now';
  }
  if (diffMins < 60) {
    return `${diffMins} min ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  
  return formatDate(dateString);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format store count
 */
export function formatStoreCount(count: number, total: number): string {
  return `${count}/${total} stores`;
}

/**
 * Get status color class
 */
export function getStatusColor(status: 'out' | 'critical' | 'low' | 'normal' | 'unknown'): string {
  switch (status) {
    case 'out':
      return 'text-red-400';
    case 'critical':
      return 'text-orange-400';
    case 'low':
      return 'text-yellow-400';
    case 'normal':
      return 'text-green-400';
    default:
      return 'text-dark-text-muted';
  }
}

/**
 * Get status background color class
 */
export function getStatusBgColor(status: 'out' | 'critical' | 'low' | 'normal' | 'unknown'): string {
  switch (status) {
    case 'out':
      return 'bg-red-900/30';
    case 'critical':
      return 'bg-orange-900/30';
    case 'low':
      return 'bg-yellow-900/30';
    case 'normal':
      return 'bg-green-900/30';
    default:
      return 'bg-dark-card';
  }
}

/**
 * Get trend arrow
 */
export function getTrendArrow(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    default:
      return '→';
  }
}

/**
 * Get trend color class
 */
export function getTrendColor(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up':
      return 'text-green-400';
    case 'down':
      return 'text-red-400';
    default:
      return 'text-dark-text-muted';
  }
}
