export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a USD amount in the given currency.
 * @param amountUsd - the amount stored in USD
 * @param currencyCode - target currency code (e.g. "INR", "EUR")
 * @param rateToUsd - how many units of target currency equal 1 USD (e.g. 83 for INR)
 */
export function formatCurrency(
  amountUsd: number,
  currencyCode: string = 'USD',
  rateToUsd: number = 1,
): string {
  const converted = amountUsd * (rateToUsd || 1);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(converted);
  } catch {
    return `$${converted.toFixed(0)}`;
  }
}

export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function countDays(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
}
