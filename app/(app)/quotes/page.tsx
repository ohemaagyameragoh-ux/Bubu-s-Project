import Link from "next/link";
import { listQuotes, quoteTotal } from "@/lib/services/quotes";
import { formatMoney, formatDate } from "@/lib/format";
import { Button, Card, Badge, PageHeader } from "@/components/ui";
import { sendQuoteAction, acceptQuoteAction, deleteQuoteAction } from "./actions";

export const dynamic = "force-dynamic";

function statusTone(status: string): "neutral" | "green" | "blue" | "peach" {
  if (status === "ACCEPTED") return "green";
  if (status === "SENT") return "blue";
  if (status === "REJECTED" || status === "EXPIRED") return "neutral";
  return "peach";
}

export default async function QuotesPage() {
  const quotes = await listQuotes();

  return (
    <div>
      <PageHeader
        title="Quotes"
        subtitle="Branded quotes you can download and send. Accept one to turn it into a confirmed order."
        action={
          <Link href="/quotes/new" className="no-underline">
            <Button>+ New quote</Button>
          </Link>
        }
      />

      {quotes.length === 0 ? (
        <Card>
          <p className="text-muted">No quotes yet. Build your first one.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <Card key={q.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{q.reference}</span>
                    <Badge tone={statusTone(q.status)}>{q.status.toLowerCase()}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted">
                    {q.clientName} · {q.lines.length} line{q.lines.length === 1 ? "" : "s"} ·{" "}
                    {q.validUntil ? `valid until ${formatDate(q.validUntil)}` : "no expiry"}
                  </div>
                  <div className="mt-2 text-sm text-ink">
                    {q.lines.map((l) => `${l.commodityName} ${l.quantity}${l.unit}`).join(", ")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl font-semibold text-ink">{formatMoney(quoteTotal(q.lines))}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                  href={`/quotes/${q.id}/document`}
                  className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink no-underline hover:border-clay/40"
                >
                  View document
                </Link>
                <form action={sendQuoteAction}>
                  <input type="hidden" name="id" value={q.id} />
                  <button className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:border-clay/40">
                    Mark as sent
                  </button>
                </form>
                <form action={acceptQuoteAction}>
                  <input type="hidden" name="id" value={q.id} />
                  <button className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-forest-dark hover:border-forest/40">
                    Accept to order
                  </button>
                </form>
                <form action={deleteQuoteAction}>
                  <input type="hidden" name="id" value={q.id} />
                  <button className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-clay-dark hover:border-clay/40">
                    Delete
                  </button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
