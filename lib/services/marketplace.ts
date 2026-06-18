import {
  ListingType,
  ListingStatus,
  OfferStatus,
  TradeMode,
  PaymentStatus,
  DeliveryStatus,
} from "@prisma/client";
import { prisma } from "../db";
import { withTenantSession } from "../session";
import { requireTenantContext } from "../tenant-context";
import { recordAudit } from "../audit";
import { deriveStatus } from "../transaction-status";

// The marketplace is the one place data crosses tenants by design: a board everyone can browse.
// It does not use the scoped client. Each listing and offer still records its owner tenant, and
// money side effects (the platform margin) post to the operator ledger, never to tenant reports.

async function currentTenant() {
  const { tenantId } = requireTenantContext();
  return prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
}

export async function listBoard(type?: ListingType) {
  return withTenantSession(() =>
    prisma.marketplaceListing.findMany({
      where: { status: ListingStatus.OPEN, ...(type ? { type } : {}) },
      orderBy: { createdAt: "desc" },
    }),
  );
}

export async function myListings() {
  return withTenantSession(async () => {
    const { tenantId } = requireTenantContext();
    return prisma.marketplaceListing.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: { offers: true },
    });
  });
}

export async function createListing(input: {
  type: ListingType;
  commodityName: string;
  grade?: string;
  quantity: number;
  unit: string;
  price: number;
  region?: string;
  note?: string;
}) {
  return withTenantSession(async () => {
    const t = await currentTenant();
    const created = await prisma.marketplaceListing.create({
      data: {
        tenantId: t.id,
        ownerName: t.name,
        type: input.type,
        commodityName: input.commodityName.trim(),
        grade: input.grade?.trim() || null,
        quantity: input.quantity,
        unit: input.unit,
        price: input.price,
        region: input.region?.trim() ?? "",
        note: input.note?.trim() ?? "",
      },
    });
    await recordAudit({ action: "listing.create", entity: "MarketplaceListing", entityId: created.id });
    return created;
  });
}

export async function makeOffer(listingId: string, price: number, quantity: number, message: string) {
  return withTenantSession(async () => {
    const t = await currentTenant();
    const listing = await prisma.marketplaceListing.findUnique({ where: { id: listingId } });
    if (!listing) throw new Error("Listing not found.");
    if (listing.tenantId === t.id) throw new Error("You cannot make an offer on your own listing.");
    const offer = await prisma.marketplaceOffer.create({
      data: { listingId, fromTenantId: t.id, fromName: t.name, price, quantity, message: message.trim() },
    });
    await recordAudit({ action: "offer.make", entity: "MarketplaceOffer", entityId: offer.id });
    return offer;
  });
}

// Create a transaction for a given tenant using the base client. Used to write the trade record
// onto both sides of a matched deal. Generates a per tenant reference.
async function createTxnForTenant(
  tenantId: string,
  data: {
    mode: TradeMode;
    commodityName: string;
    grade: string | null;
    quantity: number;
    unit: string;
    counterparty: string;
    buyPrice?: number | null;
    sellPrice?: number | null;
    commission?: number | null;
  },
) {
  const year = new Date().getFullYear();
  const count = await prisma.transaction.count({
    where: { tenantId, tradeDate: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
  });
  for (let i = 0; i < 6; i += 1) {
    const reference = `TXN-${year}-${String(count + 1 + i).padStart(4, "0")}`;
    try {
      return await prisma.transaction.create({
        data: {
          tenantId,
          reference,
          mode: data.mode,
          commodityId: "",
          commodityName: data.commodityName,
          grade: data.grade,
          quantity: data.quantity,
          unit: data.unit,
          counterparty: data.counterparty,
          tradeDate: new Date(),
          buyPrice: data.buyPrice ?? null,
          sellPrice: data.sellPrice ?? null,
          commission: data.commission ?? null,
          paymentStatus: PaymentStatus.UNPAID,
          deliveryStatus: DeliveryStatus.PENDING,
          status: deriveStatus(PaymentStatus.UNPAID, DeliveryStatus.PENDING, null),
        },
      });
    } catch {
      if (i < 5) continue;
      throw new Error("Could not allocate a transaction reference.");
    }
  }
}

// Accept an offer. This matches the deal, writes a transaction onto both traders' books, and
// records the platform's brokered margin (the spread) on the operator ledger only.
export async function acceptOffer(offerId: string) {
  return withTenantSession(async () => {
    const me = await currentTenant();
    const offer = await prisma.marketplaceOffer.findUnique({ where: { id: offerId }, include: { listing: true } });
    if (!offer) throw new Error("Offer not found.");
    const listing = offer.listing;
    if (listing.tenantId !== me.id) throw new Error("Only the listing owner can accept an offer.");

    const qty = offer.quantity;
    let sellerTenantId: string;
    let sellerName: string;
    let buyerTenantId: string;
    let buyerName: string;
    let sellerPrice: number;
    let buyerPrice: number;

    if (listing.type === ListingType.SELL) {
      // Owner is selling. The offerer buys.
      sellerTenantId = listing.tenantId;
      sellerName = listing.ownerName;
      buyerTenantId = offer.fromTenantId;
      buyerName = offer.fromName;
      sellerPrice = listing.price;
      buyerPrice = offer.price;
    } else {
      // Owner posted a buy request. The offerer sells to them.
      buyerTenantId = listing.tenantId;
      buyerName = listing.ownerName;
      sellerTenantId = offer.fromTenantId;
      sellerName = offer.fromName;
      buyerPrice = listing.price;
      sellerPrice = offer.price;
    }

    const margin = Math.max(0, (buyerPrice - sellerPrice) * qty);

    await prisma.marketplaceOffer.update({ where: { id: offerId }, data: { status: OfferStatus.ACCEPTED } });
    await prisma.marketplaceListing.update({ where: { id: listing.id }, data: { status: ListingStatus.MATCHED } });

    // Each side gets an owner trade recording the deal.
    await createTxnForTenant(sellerTenantId, {
      mode: TradeMode.OWNER,
      commodityName: listing.commodityName,
      grade: listing.grade,
      quantity: qty,
      unit: listing.unit,
      counterparty: buyerName,
      sellPrice: sellerPrice,
    });
    await createTxnForTenant(buyerTenantId, {
      mode: TradeMode.OWNER,
      commodityName: listing.commodityName,
      grade: listing.grade,
      quantity: qty,
      unit: listing.unit,
      counterparty: sellerName,
      buyPrice: buyerPrice,
    });

    await prisma.marketplaceDeal.create({
      data: {
        listingId: listing.id,
        commodityName: listing.commodityName,
        quantity: qty,
        unit: listing.unit,
        buyerTenantId,
        sellerTenantId,
        buyPrice: buyerPrice,
        sellPrice: sellerPrice,
        platformMargin: margin,
      },
    });

    if (margin > 0) {
      await prisma.platformLedgerEntry.create({
        data: {
          source: "MARKETPLACE_MARGIN",
          amount: margin,
          refTenantName: listing.ownerName,
          description: `Marketplace match on ${listing.commodityName}`,
        },
      });
    }

    await recordAudit({ action: "offer.accept", entity: "MarketplaceOffer", entityId: offerId, metadata: { margin } });
    return { margin };
  });
}

export async function raiseDispute(againstTenantId: string, listingId: string, reason: string) {
  return withTenantSession(async () => {
    const { tenantId } = requireTenantContext();
    await prisma.dispute.create({
      data: { raisedByTenantId: tenantId, againstTenantId, listingId, reason: reason.trim() || "Unspecified" },
    });
    await recordAudit({ action: "dispute.raise", entity: "Dispute", entityId: listingId });
  });
}
