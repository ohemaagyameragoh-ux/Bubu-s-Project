import { IntegrationKind } from "@prisma/client";
import { tenantDb } from "../tenant-db";
import { withTenantSession } from "../session";
import { requireTenantContext } from "../tenant-context";
import { recordAudit } from "../audit";

// Each tenant connects their own outside accounts (WhatsApp, email, mobile money, bank, price
// feed). Nothing is shared between tenants. In development these are stored as configuration; the
// provider calls are stubbed, and money never moves without an explicit user action elsewhere.
export async function listIntegrations() {
  return withTenantSession(() => tenantDb().integrationCredential.findMany({ orderBy: { kind: "asc" } }));
}

export async function upsertIntegration(kind: IntegrationKind, label: string, config: Record<string, string>, connected: boolean) {
  return withTenantSession(async () => {
    const { tenantId } = requireTenantContext();
    const existing = await tenantDb().integrationCredential.findFirst({ where: { kind } });
    const data = { label: label.trim(), config: config as object, connected };
    const saved = existing
      ? await tenantDb().integrationCredential.update({ where: { id: existing.id }, data })
      : await tenantDb().integrationCredential.create({ data: { tenantId, kind, ...data } });
    await recordAudit({ action: "integration.update", entity: "IntegrationCredential", entityId: saved.id, metadata: { kind, connected } });
    return saved;
  });
}
