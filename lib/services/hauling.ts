import { HaulageStatus, HaulingQuoteStatus } from "@prisma/client";
import { prisma } from "../db";
import { tenantDb } from "../tenant-db";
import { withTenantSession } from "../session";
import { requireTenantContext } from "../tenant-context";
import { recordAudit } from "../audit";
import { createWithReference } from "../reference";

export async function listRequests() {
  return withTenantSession(() =>
    tenantDb().haulageRequest.findMany({ orderBy: { createdAt: "desc" }, include: { quotes: true } }),
  );
}

export async function createRequest(input: {
  pickup: string;
  dropoff: string;
  commodityName: string;
  tonnage: number;
  vehicleType: string;
  pickupDate?: Date | null;
  commissionFeePct: number;
  chargeTo: string;
}) {
  return withTenantSession(async () => {
    const { tenantId } = requireTenantContext();
    const created = await createWithReference(
      "HR",
      () => tenantDb().haulageRequest.count(),
      (reference) =>
        tenantDb().haulageRequest.create({
          data: {
            tenantId,
            reference,
            pickup: input.pickup.trim(),
            dropoff: input.dropoff.trim(),
            commodityName: input.commodityName.trim(),
            tonnage: input.tonnage,
            vehicleType: input.vehicleType.trim(),
            pickupDate: input.pickupDate ?? null,
            commissionFeePct: input.commissionFeePct,
            chargeTo: input.chargeTo,
          },
        }),
    );
    await recordAudit({ action: "haulage.create", entity: "HaulageRequest", entityId: created.id });
    return created;
  });
}

export async function addQuote(requestId: string, transporterName: string, amount: number, etaDays: number | null, note: string) {
  return withTenantSession(async () => {
    const { tenantId } = requireTenantContext();
    const quote = await tenantDb().haulingQuote.create({
      data: { tenantId, requestId, transporterName: transporterName.trim(), amount, etaDays, note: note.trim() },
    });
    await tenantDb().haulageRequest.update({ where: { id: requestId }, data: { status: HaulageStatus.QUOTED } });
    await recordAudit({ action: "haulage.quote", entity: "HaulingQuote", entityId: quote.id });
    return quote;
  });
}

// Book a transporter. The platform earns a configurable commission on the freight, posted to the
// operator ledger only. Traders never see that ledger.
export async function bookQuote(requestId: string, quoteId: string) {
  return withTenantSession(async () => {
    const db = tenantDb();
    const request = await db.haulageRequest.findFirst({ where: { id: requestId } });
    const quote = await db.haulingQuote.findFirst({ where: { id: quoteId } });
    if (!request || !quote) throw new Error("Request or quote not found.");

    await db.haulingQuote.update({ where: { id: quoteId }, data: { status: HaulingQuoteStatus.ACCEPTED } });
    await db.haulageRequest.update({
      where: { id: requestId },
      data: { status: HaulageStatus.BOOKED, bookedQuoteId: quoteId },
    });

    const fee = (quote.amount * request.commissionFeePct) / 100;
    if (fee > 0) {
      await prisma.platformLedgerEntry.create({
        data: {
          source: "FREIGHT_COMMISSION",
          amount: fee,
          refTenantName: request.commodityName,
          description: `Freight booking ${request.reference} (${quote.transporterName})`,
        },
      });
    }
    await recordAudit({ action: "haulage.book", entity: "HaulageRequest", entityId: requestId, metadata: { fee } });
    return { fee };
  });
}

export async function updateRequestStatus(id: string, status: HaulageStatus) {
  return withTenantSession(async () => {
    await tenantDb().haulageRequest.update({ where: { id }, data: { status } });
    await recordAudit({ action: "haulage.status", entity: "HaulageRequest", entityId: id, metadata: { status } });
  });
}
