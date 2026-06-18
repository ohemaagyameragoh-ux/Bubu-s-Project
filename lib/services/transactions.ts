import {
  Prisma,
  TradeMode,
  PaymentStatus,
  DeliveryStatus,
  Lifecycle,
} from "@prisma/client";
import { tenantDb } from "../tenant-db";
import { withTenantSession } from "../session";
import { requireTenantContext } from "../tenant-context";
import { recordAudit } from "../audit";
import { deriveStatus } from "../transaction-status";

export type TransactionInput = {
  mode: TradeMode;
  commodityId: string;
  grade?: string;
  quantity: number;
  unit: string;
  counterparty: string;
  tradeDate: Date;
  notes?: string;
  buyPrice?: number | null;
  sellPrice?: number | null;
  capitalSource?: string;
  commission?: number | null;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
};

export type TransactionFilters = {
  commodityId?: string;
  mode?: TradeMode;
  status?: Lifecycle;
  counterparty?: string;
  from?: Date;
  to?: Date;
};

function buildWhere(filters: TransactionFilters): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = {};
  if (filters.commodityId) where.commodityId = filters.commodityId;
  if (filters.mode) where.mode = filters.mode;
  if (filters.status) where.status = filters.status;
  if (filters.counterparty) where.counterparty = { contains: filters.counterparty, mode: "insensitive" };
  if (filters.from || filters.to) {
    where.tradeDate = {};
    if (filters.from) where.tradeDate.gte = filters.from;
    if (filters.to) where.tradeDate.lte = filters.to;
  }
  return where;
}

export async function listTransactions(filters: TransactionFilters = {}) {
  return withTenantSession(() =>
    tenantDb().transaction.findMany({
      where: buildWhere(filters),
      orderBy: [{ tradeDate: "desc" }, { createdAt: "desc" }],
    }),
  );
}

export async function getTransaction(id: string) {
  return withTenantSession(() => tenantDb().transaction.findFirst({ where: { id } }));
}

export async function countTransactions(filters: TransactionFilters = {}) {
  return withTenantSession(() => tenantDb().transaction.count({ where: buildWhere(filters) }));
}

export async function createTransaction(input: TransactionInput) {
  return withTenantSession(async () => {
    const { tenantId } = requireTenantContext();

    // Validate the commodity belongs to this tenant, and snapshot its name.
    const commodity = await tenantDb().commodity.findFirst({ where: { id: input.commodityId } });
    if (!commodity) {
      throw new Error("Choose a commodity that belongs to your workspace.");
    }

    const isOwner = input.mode === TradeMode.OWNER;
    const status = deriveStatus(input.paymentStatus, input.deliveryStatus, null);
    const year = input.tradeDate.getFullYear();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    // Build a per tenant, per year reference like TXN-2026-0312. On the rare race that two
    // trades land the same number, retry with the next one (the unique index is the guard).
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const countThisYear = await tenantDb().transaction.count({
        where: { tradeDate: { gte: yearStart, lt: yearEnd } },
      });
      const seq = countThisYear + 1 + attempt;
      const reference = `TXN-${year}-${String(seq).padStart(4, "0")}`;

      try {
        const created = await tenantDb().transaction.create({
          data: {
            tenantId,
            reference,
            mode: input.mode,
            commodityId: commodity.id,
            commodityName: commodity.name,
            grade: input.grade?.trim() || null,
            quantity: input.quantity,
            unit: input.unit.trim(),
            counterparty: input.counterparty.trim(),
            tradeDate: input.tradeDate,
            notes: input.notes?.trim() ?? "",
            buyPrice: isOwner ? input.buyPrice ?? null : null,
            sellPrice: isOwner ? input.sellPrice ?? null : null,
            capitalSource: isOwner ? input.capitalSource?.trim() || null : null,
            commission: isOwner ? null : input.commission ?? null,
            paymentStatus: input.paymentStatus,
            deliveryStatus: input.deliveryStatus,
            statusOverride: null,
            status,
          },
        });

        await recordAudit({
          action: "transaction.create",
          entity: "Transaction",
          entityId: created.id,
          metadata: { mode: input.mode, reference },
        });
        return created;
      } catch (error) {
        const isUniqueClash =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
        if (isUniqueClash && attempt < 5) continue;
        throw error;
      }
    }

    // Unreachable in practice: the loop either returns or throws.
    throw new Error("Could not allocate a transaction reference. Please try again.");
  });
}

export type StatusPatch = {
  paymentStatus?: PaymentStatus;
  deliveryStatus?: DeliveryStatus;
  // undefined means leave as is. null means clear the override and return to the derived value.
  statusOverride?: Lifecycle | null;
};

export async function updateTransactionStatus(id: string, patch: StatusPatch) {
  return withTenantSession(async () => {
    const current = await tenantDb().transaction.findFirst({ where: { id } });
    if (!current) {
      throw new Error("Trade not found.");
    }

    const paymentStatus = patch.paymentStatus ?? current.paymentStatus;
    const deliveryStatus = patch.deliveryStatus ?? current.deliveryStatus;
    const statusOverride =
      patch.statusOverride === undefined ? current.statusOverride : patch.statusOverride;
    const status = deriveStatus(paymentStatus, deliveryStatus, statusOverride);

    const updated = await tenantDb().transaction.update({
      where: { id },
      data: { paymentStatus, deliveryStatus, statusOverride, status },
    });

    await recordAudit({
      action: "transaction.status.update",
      entity: "Transaction",
      entityId: id,
      metadata: { status },
    });
    return updated;
  });
}
