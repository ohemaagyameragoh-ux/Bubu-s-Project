import { redirect } from "next/navigation";
import { prisma } from "../db";
import { getSessionUser } from "../session";
import { recordAudit } from "../audit";
import { runWithTenant } from "../tenant-context";

// Operator (super admin) only. These functions cross all tenants on purpose: oversight of every
// workspace and the platform's own earnings. They are never reachable by a tenant user.
async function requirePlatformAdmin() {
  const user = await getSessionUser();
  if (!user?.isPlatformAdmin) redirect("/login");
  return user;
}

export async function listTenantsOverview() {
  await requirePlatformAdmin();
  return prisma.tenant.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { users: true, transactions: true, invoices: true } } },
  });
}

export async function platformEarnings() {
  await requirePlatformAdmin();
  const entries = await prisma.platformLedgerEntry.findMany({ orderBy: { createdAt: "desc" } });
  const bySource = (source: string) =>
    entries.filter((e) => e.source === source).reduce((a, e) => a + e.amount, 0);
  return {
    entries,
    total: entries.reduce((a, e) => a + e.amount, 0),
    marketplaceMargin: bySource("MARKETPLACE_MARGIN"),
    freightCommission: bySource("FREIGHT_COMMISSION"),
    subscriptions: bySource("SUBSCRIPTION"),
  };
}

export async function updateTenantPlan(tenantId: string, plan: string) {
  const admin = await requirePlatformAdmin();
  await prisma.tenant.update({ where: { id: tenantId }, data: { plan } });
  // Audit under the affected tenant so the trail lives with that workspace.
  await runWithTenant({ tenantId, userId: admin.id }, () =>
    recordAudit({ action: "operator.plan.update", entity: "Tenant", entityId: tenantId, metadata: { plan } }),
  );
}
