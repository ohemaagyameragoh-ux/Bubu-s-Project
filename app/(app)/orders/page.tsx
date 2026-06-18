import { listOrders } from "@/lib/services/orders";
import { listLots } from "@/lib/services/inventory";
import { listCommodities } from "@/lib/services/commodities";
import { formatMoney, formatQuantity } from "@/lib/format";
import { Card, Badge, PageHeader } from "@/components/ui";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import { OrderForm } from "@/components/orders/OrderForm";
import { updateOrderStatusAction } from "./actions";
import { LotStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const [orders, lots, commodities] = await Promise.all([listOrders(), listLots(), listCommodities()]);

  // On hand per commodity and grade, so each order can show needed, on hand, and the gap to source.
  const onHand = new Map<string, number>();
  for (const lot of lots) {
    if (lot.status === LotStatus.DISPATCHED) continue;
    const key = `${lot.commodityName}|${lot.grade ?? ""}`;
    onHand.set(key, (onHand.get(key) ?? 0) + lot.remainingWeight);
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Confirmed orders that drive sourcing and fulfillment. Each shows how much is needed, on hand, and still to source."
      />
      <OrderForm commodityNames={commodities.map((c) => c.name)} />

      {orders.length === 0 ? (
        <Card>
          <p className="text-muted">No orders yet. Accept a quote or create one above.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const have = onHand.get(`${o.commodityName}|${o.grade ?? ""}`) ?? 0;
            const gap = Math.max(0, o.quantity - have);
            return (
              <Card key={o.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">{o.reference}</span>
                      <Badge tone={o.status === "CLOSED" || o.status === "FULFILLED" ? "green" : "peach"}>
                        {o.status.toLowerCase()}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted">
                      {o.clientName} · {o.commodityName}
                      {o.grade ? ` (${o.grade})` : ""} · agreed {formatMoney(o.agreedPrice)}/{o.unit}
                    </div>
                  </div>
                  <form action={updateOrderStatusAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={o.id} />
                    <AutoSubmitSelect
                      name="status"
                      defaultValue={o.status}
                      options={["OPEN", "SOURCING", "FULFILLED", "INVOICED", "CLOSED", "CANCELLED"].map((s) => ({
                        value: s,
                        label: s.toLowerCase(),
                      }))}
                    />
                  </form>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl bg-paper p-3">
                    <div className="label-caps">Needed</div>
                    <div className="mt-1 font-medium text-ink">{formatQuantity(o.quantity, o.unit)}</div>
                  </div>
                  <div className="rounded-xl bg-paper p-3">
                    <div className="label-caps">On hand</div>
                    <div className="mt-1 font-medium text-ink">{formatQuantity(have, o.unit)}</div>
                  </div>
                  <div className="rounded-xl bg-paper p-3">
                    <div className="label-caps">To source</div>
                    <div className={"mt-1 font-medium " + (gap > 0 ? "text-clay" : "text-forest")}>
                      {formatQuantity(gap, o.unit)}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
