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
 *
 * Only for values genuinely stored in USD — activity and day costs
 * (`cost_estimate_usd`, `total_cost_usd`). A trip's `budget_usd` is despite its
 * name held in the user's own currency, so pass `rateToUsd = 1` for that or it
 * gets converted twice.
 *
 * @param amountUsd - the amount, in USD
 * @param currencyCode - target currency code (e.g. "INR", "EUR")
 * @param rateToUsd - units of the target currency per 1 USD (e.g. 83 for INR)
 */
export function formatCurrency(
  amountUsd: number,
  currencyCode: string = 'USD',
  rateToUsd: number = 1,
): string {
  // Costs are optional throughout the itinerary types, and a missing one used to
  // render as "$NaN" at any call site that forgot its own `|| 0`. Coerce here so
  // no caller has to remember.
  const amount = Number.isFinite(amountUsd) ? amountUsd : 0;
  const rate = Number.isFinite(rateToUsd) && rateToUsd > 0 ? rateToUsd : 1;
  const converted = amount * rate;

  const code = (currencyCode || 'USD').trim().toUpperCase();

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(converted);
  } catch {
    // Unknown code — show it as a prefix. Falling back to "$" here was actively
    // wrong: the amount has already been converted out of USD, so a dollar sign
    // mislabels it.
    return `${code} ${Math.round(converted).toLocaleString('en-US')}`;
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
