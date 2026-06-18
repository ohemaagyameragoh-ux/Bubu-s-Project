import { LeadSource, LeadStage } from "@prisma/client";
import { tenantDb } from "../tenant-db";
import { withTenantSession } from "../session";
import { requireTenantContext } from "../tenant-context";
import { recordAudit } from "../audit";

export type LeadInput = {
  clientName: string;
  commodityName?: string;
  source: LeadSource;
  estimatedValue?: number | null;
  message?: string;
  notes?: string;
};

export async function listLeads() {
  return withTenantSession(() =>
    tenantDb().lead.findMany({ orderBy: [{ updatedAt: "desc" }] }),
  );
}

export async function createLead(input: LeadInput) {
  return withTenantSession(async () => {
    const { tenantId } = requireTenantContext();
    const created = await tenantDb().lead.create({
      data: {
        tenantId,
        clientName: input.clientName.trim(),
        commodityName: input.commodityName?.trim() || null,
        source: input.source,
        estimatedValue: input.estimatedValue ?? null,
        message: input.message?.trim() ?? "",
        notes: input.notes?.trim() ?? "",
      },
    });
    await recordAudit({ action: "lead.create", entity: "Lead", entityId: created.id });
    return created;
  });
}

export async function updateLeadStage(id: string, stage: LeadStage) {
  return withTenantSession(async () => {
    const updated = await tenantDb().lead.update({ where: { id }, data: { stage } });
    await recordAudit({ action: "lead.stage.update", entity: "Lead", entityId: id, metadata: { stage } });
    return updated;
  });
}

export async function deleteLead(id: string) {
  return withTenantSession(async () => {
    await tenantDb().lead.delete({ where: { id } });
    await recordAudit({ action: "lead.delete", entity: "Lead", entityId: id });
  });
}
