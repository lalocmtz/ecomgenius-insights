export function formatMXN(value: number, decimals = false): string {
  return '$' + value.toLocaleString('en-US', {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  });
}

export function formatROAS(value: number): string {
  return value.toFixed(2) + 'x';
}

export function formatPct(value: number): string {
  return value.toFixed(1) + '%';
}

export function formatMarginColor(margin: number): string {
  if (margin > 0.2) return 'text-status-good';
  if (margin >= 0) return 'text-status-warning';
  return 'text-status-critical';
}
