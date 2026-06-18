import Link from "next/link";
import { listTrips } from "@/lib/services/trips";
import { formatDate } from "@/lib/format";
import { Button, Card, Badge, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

function tone(status: string): "neutral" | "green" | "blue" | "peach" {
  if (status === "DELIVERED") return "green";
  if (status === "IN_TRANSIT") return "blue";
  if (status === "CANCELLED") return "neutral";
  return "peach";
}

export default async function LogisticsPage() {
  const trips = await listTrips();

  return (
    <div>
      <PageHeader
        title="Logistics"
        subtitle="Dispatch trucks, track delivery, and reconcile what arrives against what left."
        action={
          <Link href="/logistics/new" className="no-underline">
            <Button>+ New trip</Button>
          </Link>
        }
      />

      {trips.length === 0 ? (
        <Card>
          <p className="text-muted">No trips yet. Dispatch a truck to get started.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {trips.map((t) => (
            <Link key={t.id} href={`/logistics/${t.id}`} className="block no-underline">
              <Card className="p-5 transition-colors hover:border-clay/40">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">{t.reference}</span>
                      <Badge tone={tone(t.status)}>{t.status.replace("_", " ").toLowerCase()}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted">
                      {t.commodityName} · truck {t.truck} · {t.lots.length} lot{t.lots.length === 1 ? "" : "s"}
                      {t.sealNumber ? ` · seal ${t.sealNumber}` : ""}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted">
                    {t.totalWeightSent != null ? `${t.totalWeightSent} sent` : ""}
                    {t.variance != null ? ` · variance ${t.variance}` : ""}
                    <div className="text-xs">{formatDate(t.createdAt)}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
