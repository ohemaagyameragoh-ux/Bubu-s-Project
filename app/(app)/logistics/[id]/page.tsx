import Link from "next/link";
import { notFound } from "next/navigation";
import { TripStatus } from "@prisma/client";
import { getTrip } from "@/lib/services/trips";
import { formatQuantity, formatDate } from "@/lib/format";
import { Card, Badge, PageHeader, Field, Label, Input } from "@/components/ui";
import { inTransitAction, deliveredAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function TripDetailPage({ params }: { params: { id: string } }) {
  const trip = await getTrip(params.id);
  if (!trip) notFound();

  return (
    <div>
      <PageHeader
        eyebrow={`Trip ${trip.reference}`}
        title={`${trip.commodityName} dispatch`}
        subtitle={`Truck ${trip.truck}, driver ${trip.driver}`}
        action={<Badge tone={trip.status === "DELIVERED" ? "green" : trip.status === "IN_TRANSIT" ? "blue" : "peach"}>{trip.status.replace("_", " ").toLowerCase()}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Card>
            <div className="label-caps mb-3">Loaded lots</div>
            <div className="space-y-2">
              {trip.lots.map((l) => (
                <div key={l.id} className="flex justify-between text-sm">
                  <span className="text-ink">{l.lotReference}</span>
                  <span className="text-muted">{formatQuantity(l.weight, "")}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Info label="Weighbridge in" value={trip.weighbridgeIn?.toString() ?? "-"} />
              <Info label="Weighbridge out" value={trip.weighbridgeOut?.toString() ?? "-"} />
              <Info label="Bags" value={trip.bagCount?.toString() ?? "-"} />
              <Info label="Seal" value={trip.sealNumber ?? "-"} />
              <Info label="Weight sent" value={trip.totalWeightSent?.toString() ?? "-"} />
              <Info label="Weight received" value={trip.receivedWeight?.toString() ?? "-"} />
              {trip.variance != null ? <Info label="Variance" value={trip.variance.toString()} /> : null}
              {trip.sealIntact != null ? <Info label="Seal intact" value={trip.sealIntact ? "Yes" : "No"} /> : null}
            </div>
            <div className="mt-5 flex gap-2">
              <Link
                href={`/waybills/${trip.id}/document`}
                className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink no-underline hover:border-clay/40"
              >
                Waybill
              </Link>
              {trip.status === TripStatus.DELIVERED ? (
                <Link
                  href={`/delivery-reports/${trip.id}/document`}
                  className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink no-underline hover:border-clay/40"
                >
                  Delivery report
                </Link>
              ) : null}
            </div>
          </Card>
        </div>

        <div>
          {trip.status === TripStatus.LOADING ? (
            <Card>
              <div className="label-caps mb-4">Mark in transit</div>
              <form action={inTransitAction}>
                <input type="hidden" name="id" value={trip.id} />
                <Field>
                  <Label htmlFor="departureAt">Departure</Label>
                  <Input id="departureAt" name="departureAt" type="datetime-local" />
                </Field>
                <Field>
                  <Label htmlFor="etaAt">Expected arrival</Label>
                  <Input id="etaAt" name="etaAt" type="datetime-local" />
                </Field>
                <button className="rounded-xl bg-clay px-4 py-2.5 text-sm font-medium text-white hover:bg-clay-dark">
                  Mark in transit
                </button>
              </form>
            </Card>
          ) : null}

          {trip.status === TripStatus.IN_TRANSIT ? (
            <Card>
              <div className="label-caps mb-4">Record delivery</div>
              <form action={deliveredAction}>
                <input type="hidden" name="id" value={trip.id} />
                <Field>
                  <Label htmlFor="receivedWeight">Weight received</Label>
                  <Input id="receivedWeight" name="receivedWeight" type="number" step="any" min="0" required />
                </Field>
                <label className="mb-4 flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" name="sealIntact" defaultChecked className="h-4 w-4" />
                  Seal intact on arrival
                </label>
                <Field>
                  <Label htmlFor="clientSignoff">Client sign off</Label>
                  <Input id="clientSignoff" name="clientSignoff" placeholder="Received by, GRN number" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <Label htmlFor="actualFreight">Actual freight</Label>
                    <Input id="actualFreight" name="actualFreight" type="number" step="any" min="0" />
                  </Field>
                  <Field>
                    <Label htmlFor="tripExpenses">Trip expenses</Label>
                    <Input id="tripExpenses" name="tripExpenses" type="number" step="any" min="0" />
                  </Field>
                </div>
                <Field>
                  <Label htmlFor="delay">Delay note</Label>
                  <Input id="delay" name="delay" />
                </Field>
                <button className="rounded-xl bg-clay px-4 py-2.5 text-sm font-medium text-white hover:bg-clay-dark">
                  Record delivery
                </button>
              </form>
            </Card>
          ) : null}

          {trip.status === TripStatus.DELIVERED ? (
            <Card>
              <div className="label-caps mb-2">Delivered</div>
              <p className="text-sm text-muted">
                This trip is closed. The linked transaction delivery status has been synced and the delivery report
                is ready to send.
              </p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-paper p-2">
      <div className="label-caps">{label}</div>
      <div className="mt-0.5 text-ink">{value}</div>
    </div>
  );
}
