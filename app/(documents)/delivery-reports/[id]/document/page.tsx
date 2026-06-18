import { notFound } from "next/navigation";
import { getTrip } from "@/lib/services/trips";
import { getWorkspace } from "@/lib/services/workspace";
import { formatDate } from "@/lib/format";
import { DocumentShell } from "@/components/documents/DocumentShell";

export const dynamic = "force-dynamic";

export default async function DeliveryReportDocumentPage({ params }: { params: { id: string } }) {
  const [trip, workspace] = await Promise.all([getTrip(params.id), getWorkspace()]);
  if (!trip) notFound();

  return (
    <DocumentShell
      workspace={workspace}
      docType="Delivery report"
      reference={trip.reference}
      dateLabel={formatDate(trip.createdAt)}
      backHref={`/logistics/${trip.id}`}
    >
      <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
        <Info label="Commodity" value={trip.commodityName} />
        <Info label="Truck" value={trip.truck} />
        <Info label="Seal number" value={trip.sealNumber || "-"} />
        <Info label="Seal intact on arrival" value={trip.sealIntact == null ? "-" : trip.sealIntact ? "Yes" : "No"} />
        <Info label="Departure" value={trip.departureAt ? formatDate(trip.departureAt) : "-"} />
        <Info label="Delay" value={trip.delay || "None"} />
      </div>

      <div className="rounded-xl border border-line p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="label-caps">Weight sent</div>
            <div className="mt-1 font-display text-xl text-ink">{trip.totalWeightSent ?? 0}</div>
          </div>
          <div>
            <div className="label-caps">Weight received</div>
            <div className="mt-1 font-display text-xl text-ink">{trip.receivedWeight ?? 0}</div>
          </div>
          <div>
            <div className="label-caps">Variance</div>
            <div className={"mt-1 font-display text-xl " + ((trip.variance ?? 0) > 0 ? "text-clay" : "text-forest")}>
              {trip.variance ?? 0}
            </div>
          </div>
        </div>
      </div>

      {trip.clientSignoff ? (
        <div className="mt-6 text-sm">
          <div className="label-caps mb-1">Client sign off</div>
          <div className="text-ink">{trip.clientSignoff}</div>
        </div>
      ) : null}

      <p className="mt-8 text-xs text-muted">
        Formal proof of delivery issued by {workspace.name}. Variance is the difference between weight dispatched and
        weight received.
      </p>
    </DocumentShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label-caps">{label}</div>
      <div className="mt-0.5 text-ink">{value}</div>
    </div>
  );
}
