import { CounterpartyType } from "@prisma/client";
import { listPurchases } from "@/lib/services/purchases";
import { listCounterparties } from "@/lib/services/counterparties";
import { listCommodities } from "@/lib/services/commodities";
import { formatMoney, formatQuantity, formatDate } from "@/lib/format";
import { Badge, PageHeader } from "@/components/ui";
import { FarmerPurchaseForm } from "@/components/purchases/FarmerPurchaseForm";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const [purchases, farmers, commodities] = await Promise.all([
    listPurchases(),
    listCounterparties(CounterpartyType.FARMER),
    listCommodities(),
  ]);

  return (
    <div>
      <PageHeader
        title="Farmer purchases"
        subtitle="Buy from farmers to fill orders. Each purchase becomes a tracked lot in stock. The screen works offline and syncs when you are back online."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <FarmerPurchaseForm
          farmerNames={farmers.map((f) => f.name)}
          commodityNames={commodities.map((c) => c.name)}
        />

        <div>
          <h2 className="mb-3 text-sm font-medium text-ink">Recent purchases</h2>
          <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-tan/60 text-left">
                  <th className="px-3 py-3 label-caps">Ref</th>
                  <th className="px-3 py-3 label-caps">Farmer</th>
                  <th className="px-3 py-3 label-caps">Commodity</th>
                  <th className="px-3 py-3 label-caps">Net</th>
                  <th className="px-3 py-3 label-caps">Cost</th>
                  <th className="px-3 py-3 label-caps">Paid</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted">
                      No purchases yet.
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} className="border-t border-line">
                      <td className="px-3 py-3 font-medium text-ink">{p.reference}</td>
                      <td className="px-3 py-3 text-ink">{p.farmerName}</td>
                      <td className="px-3 py-3 text-ink">
                        {p.commodityName}
                        <div className="text-xs text-muted">{formatDate(p.createdAt)}</div>
                      </td>
                      <td className="px-3 py-3 text-ink">{formatQuantity(p.netWeight, p.unit)}</td>
                      <td className="px-3 py-3 text-ink">{formatMoney(p.totalCost)}</td>
                      <td className="px-3 py-3">
                        {p.paid ? <Badge tone="green">paid</Badge> : <Badge tone="peach">unpaid</Badge>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
