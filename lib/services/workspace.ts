import { prisma } from "../db";
import { withTenantSession } from "../session";
import { requireTenantContext } from "../tenant-context";
import { recordAudit } from "../audit";

export type BrandingInput = {
  name: string;
  legalName?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  currency?: string;
};

// The Tenant row itself is not auto-scoped (it is the tenant), so we read and write it by its
// id taken from the trusted context, never from user input.
export async function getWorkspace() {
  return withTenantSession(async () => {
    const { tenantId } = requireTenantContext();
    return prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
  });
}

export async function updateBranding(input: BrandingInput) {
  return withTenantSession(async () => {
    const { tenantId } = requireTenantContext();
    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: input.name,
        legalName: input.legalName || null,
        logoUrl: input.logoUrl || null,
        email: input.email || null,
        phone: input.phone || null,
        address: input.address || null,
        currency: input.currency || "USD",
      },
    });
    await recordAudit({ action: "workspace.branding.update", entity: "Tenant", entityId: tenantId });
    return updated;
  });
}
