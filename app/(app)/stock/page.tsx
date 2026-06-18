import { stockByCommodity, listLots } from "@/lib/services/inventory";
import { formatMoney, formatQuantity, formatDate } from "@/lib/format";
import { commodityIcon } from "@/lib/commodity-icon";
import { Card, Badge, PageHeader } from "@/components/ui";
import { LotStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function ageDays(date: Date): number {
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000));
}

export default async function StockPage() {
  const [summary, lots] = await Promise.all([stockByCommodity(), listLots()]);
  const liveLots = lots.filter((l) => l.status !== LotStatus.DISPATCHED);

  return (
    <div>
      <PageHeader
        title="Stock"
        subtitle="Everything bought minus everything shipped out, by commodity, grade, location, and lot age."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summary.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">No stock yet. Buy from farmers to build inventory.</p>
          </Card>
        ) : (
          summary.map((s) => (
            <Card key={`${s.commodityName}-${s.grade}`} className="p-5">
              <div className="flex items-center gap-2">
                <span aria-hidden>{commodityIcon(s.commodityName)}</span>
                <span className="font-medium text-ink">{s.commodityName}</span>
                {s.grade ? <Badge>{s.grade}</Badge> : null}
              </div>
              <div className="mt-3 font-display text-2xl font-semibold text-ink">
                {formatQuantity(s.onHand, s.unit)}
              </div>
              <div className="mt-1 text-sm text-muted">
                {s.lotCount} lot{s.lotCount === 1 ? "" : "s"} · value {formatMoney(s.value)}
              </div>
            </Card>
          ))
        )}
      </div>

      <h2 className="mb-3 text-sm font-medium text-ink">Lots in stock</h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-tan/60 text-left">
              <th className="px-4 py-3 label-caps">Lot</th>
              <th className="px-4 py-3 label-caps">Commodity</th>
              <th className="px-4 py-3 label-caps">Source</th>
              <th className="px-4 py-3 label-caps">Location</th>
              <th className="px-4 py-3 label-caps">Remaining</th>
              <th className="px-4 py-3 label-caps">Cost</th>
              <th className="px-4 py-3 label-caps">Age</th>
            </tr>
          </thead>
          <tbody>
            {liveLots.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  No lots in stock.
                </td>
              </tr>
            ) : (
              liveLots.map((l) => (
                <tr key={l.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium text-ink">{l.reference}</td>
                  <td className="px-4 py-3 text-ink">
                    {l.commodityName}
                    {l.grade ? ` (${l.grade})` : ""}
                  </td>
                  <td className="px-4 py-3 text-muted">{l.farmerName ?? "-"}</td>
                  <td className="px-4 py-3 text-muted">{l.location || "-"}</td>
                  <td className="px-4 py-3 text-ink">{formatQuantity(l.remainingWeight, l.unit)}</td>
                  <td className="px-4 py-3 text-ink">{formatMoney(l.costPerUnit)}/{l.unit}</td>
                  <td className="px-4 py-3 text-muted">{ageDays(l.createdAt)}d · {formatDate(l.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
