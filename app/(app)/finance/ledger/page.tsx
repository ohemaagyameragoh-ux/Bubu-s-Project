import { listLedger, ledgerSummary } from "@/lib/services/ledger";
import { formatMoney, formatDate } from "@/lib/format";
import { PageHeader, StatCard, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const [summary, entries] = await Promise.all([ledgerSummary(), listLedger()]);

  return (
    <div>
      <PageHeader
        title="Ledger"
        subtitle="The books fill themselves. Purchases become cost, client payments become revenue, freight and commissions become expenses."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Revenue" value={formatMoney(summary.revenue)} accent="forest" />
        <StatCard label="Cost of goods" value={formatMoney(summary.cogs)} />
        <StatCard label="Expenses" value={formatMoney(summary.expense)} />
        <StatCard label="Net profit" value={formatMoney(summary.profit)} accent="forest" />
        <StatCard label="Receivables" value={formatMoney(summary.receivables)} accent="ocean" />
        <StatCard label="Payables" value={formatMoney(summary.payables)} accent="clay" />
      </div>

      <h2 className="mb-3 text-sm font-medium text-ink">Ledger entries</h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-tan/60 text-left">
              <th className="px-4 py-3 label-caps">Date</th>
              <th className="px-4 py-3 label-caps">Type</th>
              <th className="px-4 py-3 label-caps">Category</th>
              <th className="px-4 py-3 label-caps">Description</th>
              <th className="px-4 py-3 label-caps text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No entries yet. They appear as you record purchases, payments, and trips.
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="border-t border-line">
                  <td className="px-4 py-3 text-muted">{formatDate(e.date)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={e.type === "REVENUE" ? "green" : e.type === "COGS" ? "peach" : "neutral"}>
                      {e.type.toLowerCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-ink">{e.category}</td>
                  <td className="px-4 py-3 text-muted">{e.description}</td>
                  <td className="px-4 py-3 text-right text-ink">{formatMoney(e.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
