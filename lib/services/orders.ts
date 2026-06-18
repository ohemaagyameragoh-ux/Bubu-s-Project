import { OrderStatus } from "@prisma/client";
import { tenantDb } from "../tenant-db";
import { withTenantSession } from "../session";
import { requireTenantContext } from "../tenant-context";
import { recordAudit } from "../audit";
import { createWithReference } from "../reference";

export type OrderInput = {
  clientName: string;
  counterpartyId?: string | null;
  commodityId?: string | null;
  commodityName: string;
  grade?: string | null;
  quantity: number;
  unit: string;
  agreedPrice: number;
  quoteId?: string | null;
  notes?: string;
};

export async function listOrders() {
  return withTenantSession(() => tenantDb().order.findMany({ orderBy: { createdAt: "desc" } }));
}

export async function getOrder(id: string) {
  return withTenantSession(() => tenantDb().order.findFirst({ where: { id } }));
}

// Used both by the orders screen and by quote acceptance. Expects an active tenant context.
export async function createOrderInternal(input: OrderInput) {
  const { tenantId } = requireTenantContext();
  return createWithReference(
    "ORD",
    () => tenantDb().order.count(),
    (reference) =>
      tenantDb().order.create({
        data: {
          tenantId,
          reference,
          clientName: input.clientName.trim(),
          counterpartyId: input.counterpartyId ?? null,
          commodityId: input.commodityId ?? null,
          commodityName: input.commodityName.trim(),
          grade: input.grade ?? null,
          quantity: input.quantity,
          unit: input.unit,
          agreedPrice: input.agreedPrice,
          quoteId: input.quoteId ?? null,
          notes: input.notes?.trim() ?? "",
        },
      }),
  );
}

export async function createOrder(input: OrderInput) {
  return withTenantSession(async () => {
    const order = await createOrderInternal(input);
    await recordAudit({ action: "order.create", entity: "Order", entityId: order.id });
    return order;
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return withTenantSession(async () => {
    const updated = await tenantDb().order.update({ where: { id }, data: { status } });
    await recordAudit({ action: "order.status.update", entity: "Order", entityId: id, metadata: { status } });
    return updated;
  });
}
