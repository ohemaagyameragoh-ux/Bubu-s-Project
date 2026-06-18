import { tenantDb } from "../tenant-db";
import { withTenantSession } from "../session";
import { requireTenantContext } from "../tenant-context";
import { recordAudit } from "../audit";

export type GradeInput = { name: string; description?: string };
export type QualityParamInput = { name: string; unit?: string; maxAcceptable?: number | null };

export type CommodityInput = {
  name: string;
  description?: string;
  baseUnit: string;
  units: string[];
  grades: GradeInput[];
  qualityParams: QualityParamInput[];
};

export async function listCommodities() {
  return withTenantSession(() =>
    tenantDb().commodity.findMany({
      orderBy: { name: "asc" },
      include: {
        grades: { orderBy: { order: "asc" } },
        qualityParams: { orderBy: { order: "asc" } },
      },
    }),
  );
}

export async function createCommodity(input: CommodityInput) {
  return withTenantSession(async () => {
    // The scoped client sets tenantId on the Commodity itself. Nested grade and quality
    // rows are separate tables, so we set their tenantId explicitly from the trusted context.
    const { tenantId } = requireTenantContext();
    const commodity = await tenantDb().commodity.create({
      data: {
        tenantId,
        name: input.name.trim(),
        description: input.description?.trim() ?? "",
        baseUnit: input.baseUnit.trim(),
        units: input.units,
        grades: {
          create: input.grades.map((g, i) => ({
            tenantId,
            name: g.name.trim(),
            description: g.description?.trim() ?? "",
            order: i,
          })),
        },
        qualityParams: {
          create: input.qualityParams.map((q, i) => ({
            tenantId,
            name: q.name.trim(),
            unit: q.unit?.trim() || "%",
            maxAcceptable: q.maxAcceptable ?? null,
            order: i,
          })),
        },
      },
    });
    await recordAudit({ action: "commodity.create", entity: "Commodity", entityId: commodity.id });
    return commodity;
  });
}

export async function deleteCommodity(id: string) {
  return withTenantSession(async () => {
    // The scoped client constrains the delete to this tenant, so a foreign id cannot match.
    await tenantDb().commodity.delete({ where: { id } });
    await recordAudit({ action: "commodity.delete", entity: "Commodity", entityId: id });
  });
}
