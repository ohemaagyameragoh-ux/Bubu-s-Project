import Link from "next/link";
import { listInvoices } from "@/lib/services/invoices";
import { formatMoney, formatDate } from "@/lib/format";
import { Button, Card, Badge, PageHeader } from "@/components/ui";
import { sendInvoiceAction, recordPaymentAction, deleteInvoiceAction } from "./actions";

export const dynamic = "force-dynamic";

function tone(status: string): "neutral" | "green" | "blue" | "peach" {
  if (status === "PAID") return "green";
  if (status === "SENT") return "blue";
  if (status === "PARTIAL") return "peach";
  if (status === "OVERDUE") return "peach";
  return "neutral";
}

export default async function InvoicesPage() {
  const invoices = await listInvoices();

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Raise, send, and collect. Recording a payment is always an explicit action, never automatic."
        action={
          <Link href="/invoices/new" className="no-underline">
            <Button>+ New invoice</Button>
          </Link>
        }
      />

      {invoices.length === 0 ? (
        <Card>
          <p className="text-muted">No invoices yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const outstanding = inv.amount - inv.paidAmount;
            return (
              <Card key={inv.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">{inv.reference}</span>
                      <Badge tone={tone(inv.status)}>{inv.status.toLowerCase()}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted">
                      {inv.clientName} · {inv.lines.length} line{inv.lines.length === 1 ? "" : "s"}
                      {inv.dueDate ? ` · due ${formatDate(inv.dueDate)}` : ""}
                      {inv.creditTerms ? ` · ${inv.creditTerms}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl font-semibold text-ink">{formatMoney(inv.amount)}</div>
                    <div className="text-sm text-muted">
                      paid {formatMoney(inv.paidAmount)} · outstanding {formatMoney(outstanding)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/invoices/${inv.id}/document`}
                    className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink no-underline hover:border-clay/40"
                  >
                    View document
                  </Link>
                  <form action={sendInvoiceAction}>
                    <input type="hidden" name="id" value={inv.id} />
                    <button className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:border-clay/40">
                      Mark as sent
                    </button>
                  </form>
                  {outstanding > 0 ? (
                    <form action={recordPaymentAction} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={inv.id} />
                      <input
                        name="amount"
                        type="number"
                        step="any"
                        min="0"
                        defaultValue={outstanding}
                        className="w-28 rounded-lg border border-line px-2 py-1 text-xs"
                      />
                      <input
                        name="method"
                        placeholder="Method"
                        defaultValue="Mobile money"
                        className="w-28 rounded-lg border border-line px-2 py-1 text-xs"
                      />
                      <button className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-forest-dark hover:border-forest/40">
                        Record payment
                      </button>
                    </form>
                  ) : null}
                  <form action={deleteInvoiceAction}>
                    <input type="hidden" name="id" value={inv.id} />
                    <button className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-clay-dark hover:border-clay/40">
                      Delete
                    </button>
                  </form>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
