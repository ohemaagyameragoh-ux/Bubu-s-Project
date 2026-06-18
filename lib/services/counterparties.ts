import { CounterpartyType } from "@prisma/client";
import { tenantDb } from "../tenant-db";
import { withTenantSession } from "../session";
import { requireTenantContext } from "../tenant-context";
import { recordAudit } from "../audit";

export type CounterpartyInput = {
  type: CounterpartyType;
  name: string;
  phone?: string;
  email?: string;
  location?: string;
  notes?: string;
};

export async function listCounterparties(type?: CounterpartyType) {
  return withTenantSession(() =>
    tenantDb().counterparty.findMany({
      where: type ? { type } : {},
      orderBy: { name: "asc" },
    }),
  );
}

export async function createCounterparty(input: CounterpartyInput) {
  return withTenantSession(async () => {
    const { tenantId } = requireTenantContext();
    const created = await tenantDb().counterparty.create({
      data: {
        tenantId,
        type: input.type,
        name: input.name.trim(),
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        location: input.location?.trim() || null,
        notes: input.notes?.trim() ?? "",
      },
    });
    await recordAudit({ action: "counterparty.create", entity: "Counterparty", entityId: created.id, metadata: { type: input.type } });
    return created;
  });
}

export async function deleteCounterparty(id: string) {
  return withTenantSession(async () => {
    await tenantDb().counterparty.delete({ where: { id } });
    await recordAudit({ action: "counterparty.delete", entity: "Counterparty", entityId: id });
  });
}
