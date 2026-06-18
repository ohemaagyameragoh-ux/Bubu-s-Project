import { LotStatus, TripStatus, LedgerType, DeliveryStatus } from "@prisma/client";
import { tenantDb } from "../tenant-db";
import { withTenantSession } from "../session";
import { requireTenantContext } from "../tenant-context";
import { recordAudit } from "../audit";
import { createWithReference } from "../reference";
import { postLedger } from "./ledger";
import { deriveStatus } from "../transaction-status";

export type TripInput = {
  orderId?: string | null;
  transactionId?: string | null;
  commodityName: string;
  truck: string;
  driver: string;
  transporterName?: string;
  freightRate?: number | null;
  weighbridgeIn?: number | null;
  weighbridgeOut?: number | null;
  bagCount?: number | null;
  sealNumber?: string;
  lots: { lotId: string; weight: number }[];
};

export async function listTrips() {
  return withTenantSession(() =>
    tenantDb().trip.findMany({ orderBy: { createdAt: "desc" }, include: { lots: true } }),
  );
}

export async function getTrip(id: string) {
  return withTenantSession(() => tenantDb().trip.findFirst({ where: { id }, include: { lots: true } }));
}

export async function createTrip(input: TripInput) {
  return withTenantSession(async () => {
    const { tenantId } = requireTenantContext();
    const db = tenantDb();

    const lotIds = input.lots.map((l) => l.lotId);
    const lotRecords = await db.inventoryLot.findMany({ where: { id: { in: lotIds } } });

    const totalWeightSent =
      input.weighbridgeIn != null && input.weighbridgeOut != null
        ? Math.abs(input.weighbridgeOut - input.weighbridgeIn)
        : input.lots.reduce((a, l) => a + l.weight, 0);

    const trip = await createWithReference(
      "TRP",
      () => db.trip.count(),
      (reference) =>
        db.trip.create({
          data: {
            tenantId,
            reference,
            orderId: input.orderId ?? null,
            transactionId: input.transactionId ?? null,
            commodityName: input.commodityName,
            truck: input.truck.trim(),
            driver: input.driver.trim(),
            transporterName: input.transporterName?.trim() ?? "",
            freightRate: input.freightRate ?? null,
            weighbridgeIn: input.weighbridgeIn ?? null,
            weighbridgeOut: input.weighbridgeOut ?? null,
            bagCount: input.bagCount ?? null,
            totalWeightSent,
            sealNumber: input.sealNumber?.trim() || null,
            status: TripStatus.LOADING,
          },
        }),
    );

    // Load the chosen lots, oldest first for traceability. Each loaded weight reduces the lot.
    for (const line of input.lots) {
      const rec = lotRecords.find((l) => l.id === line.lotId);
      if (!rec) continue;
      const w = Math.min(line.weight, rec.remainingWeight);
      await db.tripLot.create({
        data: { tenantId, tripId: trip.id, lotId: rec.id, lotReference: rec.reference, weight: w },
      });
      const remaining = Math.max(0, rec.remainingWeight - w);
      await db.inventoryLot.update({
        where: { id: rec.id },
        data: { remainingWeight: remaining, status: remaining <= 0 ? LotStatus.DISPATCHED : LotStatus.PARTIAL },
      });
    }

    await recordAudit({ action: "trip.create", entity: "Trip", entityId: trip.id });
    return trip;
  });
}

export async function markTripInTransit(id: string, departureAt: Date | null, etaAt: Date | null) {
  return withTenantSession(async () => {
    const updated = await tenantDb().trip.update({
      where: { id },
      data: { status: TripStatus.IN_TRANSIT, departureAt, etaAt },
    });
    await recordAudit({ action: "trip.in_transit", entity: "Trip", entityId: id });
    return updated;
  });
}

export type DeliveryInput = {
  receivedWeight: number;
  sealIntact: boolean;
  clientSignoff?: string;
  actualFreight?: number | null;
  tripExpenses?: number | null;
  delay?: string;
};

export async function markTripDelivered(id: string, input: DeliveryInput) {
  return withTenantSession(async () => {
    const db = tenantDb();
    const trip = await db.trip.findFirst({ where: { id } });
    if (!trip) throw new Error("Trip not found.");

    const variance = (trip.totalWeightSent ?? 0) - input.receivedWeight;

    const updated = await db.trip.update({
      where: { id },
      data: {
        status: TripStatus.DELIVERED,
        receivedWeight: input.receivedWeight,
        sealIntact: input.sealIntact,
        clientSignoff: input.clientSignoff?.trim() || null,
        actualFreight: input.actualFreight ?? null,
        tripExpenses: input.tripExpenses ?? null,
        delay: input.delay?.trim() || null,
        variance,
      },
    });

    const cost = (input.actualFreight ?? 0) + (input.tripExpenses ?? 0);
    if (cost > 0) {
      await postLedger({
        type: LedgerType.EXPENSE,
        category: "Freight and trip",
        amount: cost,
        description: `Trip ${trip.reference} (${trip.commodityName})`,
        refEntity: "Trip",
        refId: id,
      });
    }

    // Sync the linked transaction delivery status so the dashboard lifecycle stays accurate.
    if (trip.transactionId) {
      const txn = await db.transaction.findFirst({ where: { id: trip.transactionId } });
      if (txn) {
        const status = deriveStatus(txn.paymentStatus, DeliveryStatus.DELIVERED, txn.statusOverride);
        await db.transaction.update({
          where: { id: txn.id },
          data: { deliveryStatus: DeliveryStatus.DELIVERED, status },
        });
      }
    }

    await recordAudit({ action: "trip.delivered", entity: "Trip", entityId: id, metadata: { variance } });
    return updated;
  });
}
