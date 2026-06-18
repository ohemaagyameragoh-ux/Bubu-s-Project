import { TradeMode } from "@prisma/client";
import { listTransactions, type TransactionFilters } from "./transactions";
import { ownerProfit } from "../transaction-status";

// Reports keep two strictly separate buckets, exactly as the brief requires: owner profit and
// loss for owned trades, and broker commission income for brokered trades. They never mix.

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export type OwnerRow = {
  id: string;
  reference: string;
  tradeDate: Date;
  commodityName: string;
  counterparty: string;
  quantity: number;
  unit: string;
  revenue: number;
  cost: number;
  profit: number;
};

export type OwnerGroup = { key: string; label: string; count: number; revenue: number; cost: number; profit: number };

export async function ownerPnlReport(filters: TransactionFilters = {}) {
  const txns = await listTransactions({ ...filters, mode: TradeMode.OWNER });
  const rows: OwnerRow[] = txns.map((t) => {
    const { revenue, cost, profit } = ownerProfit(t.quantity, t.buyPrice, t.sellPrice);
    return {
      id: t.id,
      reference: t.reference,
      tradeDate: t.tradeDate,
      commodityName: t.commodityName,
      counterparty: t.counterparty,
      quantity: t.quantity,
      unit: t.unit,
      revenue,
      cost,
      profit,
    };
  });

  const totals = rows.reduce(
    (a, r) => ({ count: a.count + 1, revenue: a.revenue + r.revenue, cost: a.cost + r.cost, profit: a.profit + r.profit }),
    { count: 0, revenue: 0, cost: 0, profit: 0 },
  );

  const group = (keyFn: (r: OwnerRow) => string, labelFn: (k: string) => string): OwnerGroup[] => {
    const map = new Map<string, OwnerGroup>();
    for (const r of rows) {
      const key = keyFn(r);
      const g = map.get(key) ?? { key, label: labelFn(key), count: 0, revenue: 0, cost: 0, profit: 0 };
      g.count += 1;
      g.revenue += r.revenue;
      g.cost += r.cost;
      g.profit += r.profit;
      map.set(key, g);
    }
    return [...map.values()].sort((a, b) => b.profit - a.profit);
  };

  return {
    rows,
    totals,
    byCommodity: group((r) => r.commodityName, (k) => k),
    byCounterparty: group((r) => r.counterparty, (k) => k),
    byMonth: group((r) => monthKey(r.tradeDate), monthLabel).sort((a, b) => a.key.localeCompare(b.key)),
  };
}

export type BrokerRow = {
  id: string;
  reference: string;
  tradeDate: Date;
  commodityName: string;
  counterparty: string;
  quantity: number;
  unit: string;
  commission: number;
};

export type BrokerGroup = { key: string; label: string; count: number; commission: number };

export async function brokerCommissionReport(filters: TransactionFilters = {}) {
  const txns = await listTransactions({ ...filters, mode: TradeMode.BROKER });
  const rows: BrokerRow[] = txns.map((t) => ({
    id: t.id,
    reference: t.reference,
    tradeDate: t.tradeDate,
    commodityName: t.commodityName,
    counterparty: t.counterparty,
    quantity: t.quantity,
    unit: t.unit,
    commission: t.commission ?? 0,
  }));

  const totals = rows.reduce(
    (a, r) => ({ count: a.count + 1, commission: a.commission + r.commission }),
    { count: 0, commission: 0 },
  );

  const group = (keyFn: (r: BrokerRow) => string, labelFn: (k: string) => string): BrokerGroup[] => {
    const map = new Map<string, BrokerGroup>();
    for (const r of rows) {
      const key = keyFn(r);
      const g = map.get(key) ?? { key, label: labelFn(key), count: 0, commission: 0 };
      g.count += 1;
      g.commission += r.commission;
      map.set(key, g);
    }
    return [...map.values()].sort((a, b) => b.commission - a.commission);
  };

  return {
    rows,
    totals,
    byCommodity: group((r) => r.commodityName, (k) => k),
    byCounterparty: group((r) => r.counterparty, (k) => k),
    byMonth: group((r) => monthKey(r.tradeDate), monthLabel).sort((a, b) => a.key.localeCompare(b.key)),
  };
}
