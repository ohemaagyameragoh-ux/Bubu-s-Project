import { InvoiceStatus } from "@prisma/client";
import { tenantDb } from "../tenant-db";
import { withTenantSession } from "../session";

export type CashWeek = {
  label: string;
  inflow: number;
  outflow: number;
  net: number;
  cumulative: number;
};

// Forecast the cash position over the coming weeks. Paying farmers now but being paid by clients
// later creates a predictable squeeze, so the trader is warned before they run short. Amounts are
// relative to today (no opening bank balance is assumed).
export async function cashFlowForecast() {
  return withTenantSession(async () => {
    const db = tenantDb();
    const [invoices, purchases] = await Promise.all([
      db.invoice.findMany(),
      db.farmerPurchase.findMany(),
    ]);

    const WEEKS = 6;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const weekIndex = (d: Date) => {
      const diff = Math.floor((d.getTime() - start.getTime()) / (7 * 86_400_000));
      return Math.min(WEEKS - 1, Math.max(0, diff));
    };

    const inflow = new Array(WEEKS).fill(0);
    const outflow = new Array(WEEKS).fill(0);

    for (const inv of invoices) {
      if (inv.status === InvoiceStatus.PAID || inv.status === InvoiceStatus.CANCELLED) continue;
      const outstanding = inv.amount - inv.paidAmount;
      if (outstanding <= 0) continue;
      const due = inv.dueDate ?? new Date(inv.createdAt.getTime() + 14 * 86_400_000);
      inflow[weekIndex(due)] += outstanding;
    }

    // Unpaid farmer purchases are money owed now, so they land in the first week.
    for (const p of purchases) {
      if (!p.paid) outflow[0] += p.totalCost;
    }

    const weeks: CashWeek[] = [];
    let cumulative = 0;
    for (let i = 0; i < WEEKS; i += 1) {
      const net = inflow[i] - outflow[i];
      cumulative += net;
      const ws = new Date(start.getTime() + i * 7 * 86_400_000);
      weeks.push({
        label: `Week of ${ws.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
        inflow: inflow[i],
        outflow: outflow[i],
        net,
        cumulative,
      });
    }

    const lowest = Math.min(...weeks.map((w) => w.cumulative));
    return { weeks, lowest, atRisk: lowest < 0 };
  });
}
