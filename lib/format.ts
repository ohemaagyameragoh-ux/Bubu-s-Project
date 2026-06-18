// Display helpers. Currency is GHS across the app for now, configurable per workspace later.

export function formatMoney(amount: number | null | undefined): string {
  const value = amount ?? 0;
  return `GHS ${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

// Compact money for tight spaces, for example GHS 1.1M.
export function formatMoneyShort(amount: number | null | undefined): string {
  const value = amount ?? 0;
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `GHS ${(value / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })}M`;
  if (abs >= 1_000) return `GHS ${(value / 1_000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k`;
  return formatMoney(value);
}

export function formatQuantity(quantity: number, unit: string): string {
  return `${quantity.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${unit}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatLongDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
