import { cashFlowForecast } from "@/lib/services/cashflow";
import { formatMoney } from "@/lib/format";
import { Card, PageHeader, StatCard, Alert } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CashFlowPage() {
  const { weeks, lowest, atRisk } = await cashFlowForecast();

  return (
    <div>
      <PageHeader
        title="Cash flow forecast"
        subtitle="Paying farmers now but being paid by clients later creates a squeeze. This projects your position so you are warned before you run short."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Lowest projected position"
          value={formatMoney(lowest)}
          accent={atRisk ? "clay" : "forest"}
          sub="Relative to today, before any opening balance"
        />
        <div className="flex items-center">
          {atRisk ? (
            <Alert kind="error">
              Your projected cash position goes negative within the next six weeks. Consider bringing forward client
              collections or slowing farmer purchases.
            </Alert>
          ) : (
            <Alert kind="success">Your projected cash position stays positive over the next six weeks.</Alert>
          )}
        </div>
      </div>

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-tan/60 text-left">
              <th className="px-4 py-3 label-caps">Week</th>
              <th className="px-4 py-3 label-caps text-right">Inflow</th>
              <th className="px-4 py-3 label-caps text-right">Outflow</th>
              <th className="px-4 py-3 label-caps text-right">Net</th>
              <th className="px-4 py-3 label-caps text-right">Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => (
              <tr key={w.label} className="border-t border-line">
                <td className="px-4 py-3 text-ink">{w.label}</td>
                <td className="px-4 py-3 text-right text-forest">{formatMoney(w.inflow)}</td>
                <td className="px-4 py-3 text-right text-clay">{formatMoney(w.outflow)}</td>
                <td className="px-4 py-3 text-right text-ink">{formatMoney(w.net)}</td>
                <td className={"px-4 py-3 text-right font-medium " + (w.cumulative < 0 ? "text-clay" : "text-ink")}>
                  {formatMoney(w.cumulative)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-xs text-muted">
        Inflows are outstanding invoices on their due dates. Outflows are unpaid farmer purchases. This is an estimate,
        not a guarantee.
      </p>
    </div>
  );
}
