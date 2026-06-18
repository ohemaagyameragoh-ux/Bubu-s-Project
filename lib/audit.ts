import type { Prisma } from "@prisma/client";
import { tenantDb } from "./tenant-db";
import { requireTenantContext } from "./tenant-context";

// Append a row to the tenant audit log. The acting user and tenant are read from the trusted
// context. The scoped client also pins tenantId, so the value here can never be wrong. Every
// money-related or sensitive action should call this so there is a record of who did what.
export async function recordAudit(input: {
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { tenantId, userId } = requireTenantContext();
  await tenantDb().auditLog.create({
    data: {
      tenantId,
      userId: userId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
