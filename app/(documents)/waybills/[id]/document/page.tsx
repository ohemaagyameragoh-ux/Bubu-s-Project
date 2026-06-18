import { notFound } from "next/navigation";
import { getTrip } from "@/lib/services/trips";
import { getWorkspace } from "@/lib/services/workspace";
import { formatDate, formatQuantity } from "@/lib/format";
import { DocumentShell } from "@/components/documents/DocumentShell";

export const dynamic = "force-dynamic";

export default async function WaybillDocumentPage({ params }: { params: { id: string } }) {
  const [trip, workspace] = await Promise.all([getTrip(params.id), getWorkspace()]);
  if (!trip) notFound();

  return (
    <DocumentShell workspace={workspace} docType="Waybill" reference={trip.reference} dateLabel={formatDate(trip.createdAt)} backHref={`/logistics/${trip.id}`}>
      <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
        <Info label="Commodity" value={trip.commodityName} />
        <Info label="Truck" value={trip.truck} />
        <Info label="Driver" value={trip.driver} />
        <Info label="Transporter" value={trip.transporterName || "-"} />
        <Info label="Seal number" value={trip.sealNumber || "-"} />
        <Info label="Bags" value={trip.bagCount?.toString() || "-"} />
        <Info label="Weighbridge in" value={trip.weighbridgeIn?.toString() || "-"} />
        <Info label="Weighbridge out" value={trip.weighbridgeOut?.toString() || "-"} />
      </div>

      <div className="label-caps mb-2">Lots loaded</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-muted">
            <th className="py-2">Lot</th>
            <th className="py-2 text-right">Weight</th>
          </tr>
        </thead>
        <tbody>
          {trip.lots.map((l) => (
            <tr key={l.id} className="border-b border-line">
              <td className="py-2 text-ink">{l.lotReference}</td>
              <td className="py-2 text-right text-ink">{formatQuantity(l.weight, "")}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="py-2 text-right font-medium text-ink">Total weight sent</td>
            <td className="py-2 text-right font-display text-lg font-semibold text-ink">
              {trip.totalWeightSent ?? 0}
            </td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-8 text-xs text-muted">
        Goods leaving the yard of {workspace.name}. Seal must be intact on arrival.
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
