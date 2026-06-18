import { listRequests } from "@/lib/services/hauling";
import { formatMoney, formatDate } from "@/lib/format";
import { Card, Badge, PageHeader } from "@/components/ui";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import { RequestForm } from "@/components/hauling/RequestForm";
import { addQuoteAction, bookQuoteAction, updateRequestStatusAction } from "./actions";

export const dynamic = "force-dynamic";

function tone(status: string): "neutral" | "green" | "blue" | "peach" {
  if (status === "DELIVERED") return "green";
  if (status === "IN_TRANSIT") return "blue";
  if (status === "BOOKED") return "green";
  return "peach";
}

export default async function HaulingPage() {
  const requests = await listRequests();

  return (
    <div>
      <PageHeader title="Hauling and logistics" subtitle="Request transport, compare quotes, and track delivery. The platform takes a small commission on each freight job." />
      <RequestForm />

      {requests.length === 0 ? (
        <Card>
          <p className="text-muted">No haulage requests yet. Post one to start receiving quotes.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const booked = r.quotes.find((q) => q.id === r.bookedQuoteId);
            return (
              <Card key={r.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">{r.reference}</span>
                      <Badge tone={tone(r.status)}>{r.status.replace("_", " ").toLowerCase()}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted">
                      {r.commodityName} · {r.tonnage} MT · {r.vehicleType} · {r.pickup} to {r.dropoff}
                      {r.pickupDate ? ` · pickup ${formatDate(r.pickupDate)}` : ""}
                    </div>
                  </div>
                  <form action={updateRequestStatusAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <AutoSubmitSelect
                      name="status"
                      defaultValue={r.status}
                      options={["REQUESTED", "QUOTED", "BOOKED", "IN_TRANSIT", "DELIVERED", "CANCELLED"].map((s) => ({
                        value: s,
                        label: s.replace("_", " ").toLowerCase(),
                      }))}
                    />
                  </form>
                </div>

                <div className="mt-4 space-y-2">
                  {r.quotes.length === 0 ? (
                    <div className="text-sm text-muted">No quotes yet.</div>
                  ) : (
                    r.quotes.map((q) => (
                      <div key={q.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line p-3 text-sm">
                        <div className="text-ink">
                          {q.transporterName} · {formatMoney(q.amount)}
                          {q.etaDays != null ? ` · ETA ${q.etaDays}d` : ""}
                          {q.note ? <span className="text-muted"> · {q.note}</span> : null}
                        </div>
                        {r.bookedQuoteId === q.id ? (
                          <Badge tone="green">booked</Badge>
                        ) : r.status === "REQUESTED" || r.status === "QUOTED" ? (
                          <form action={bookQuoteAction}>
                            <input type="hidden" name="requestId" value={r.id} />
                            <input type="hidden" name="quoteId" value={q.id} />
                            <button className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-forest-dark hover:border-forest/40">
                              Book
                            </button>
                          </form>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>

                {!booked ? (
                  <form action={addQuoteAction} className="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-3">
                    <input type="hidden" name="requestId" value={r.id} />
                    <input name="transporterName" placeholder="Transporter" className="rounded-lg border border-line px-2 py-1 text-sm" />
                    <input name="amount" type="number" step="any" min="0" placeholder="Amount" className="w-28 rounded-lg border border-line px-2 py-1 text-sm" />
                    <input name="etaDays" type="number" min="0" placeholder="ETA days" className="w-24 rounded-lg border border-line px-2 py-1 text-sm" />
                    <input name="note" placeholder="Note" className="flex-1 rounded-lg border border-line px-2 py-1 text-sm" />
                    <button className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-clay/40">
                      Add quote
                    </button>
                  </form>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
