import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { tenantDb } from "@/lib/tenant-db";
import { runWithTenant } from "@/lib/tenant-context";

// These tests are the gate for the multi-tenant spine. They prove that the scoped client
// confines every read, write, and delete to the active tenant, and that no tenant context
// means no access at all. If any of these fail, the isolation guarantee is broken.

let t1 = "";
let t2 = "";
const stamp = Date.now();

beforeAll(async () => {
  const a = await prisma.tenant.create({ data: { name: "Tenant One", slug: `t1-${stamp}` } });
  const b = await prisma.tenant.create({ data: { name: "Tenant Two", slug: `t2-${stamp}` } });
  t1 = a.id;
  t2 = b.id;
});

afterAll(async () => {
  // Cascades remove the commodities and everything else created during the run.
  await prisma.tenant.deleteMany({ where: { id: { in: [t1, t2] } } });
  await prisma.$disconnect();
});

describe("tenant isolation", () => {
  it("refuses to touch tenant-owned data with no context", () => {
    expect(() => tenantDb()).toThrow();
  });

  it("sets tenantId on create from context, ignoring any supplied tenantId", async () => {
    const created = await runWithTenant({ tenantId: t1 }, () =>
      // Try to smuggle in the other tenant's id. The scoped client must override it.
      tenantDb().commodity.create({ data: { name: "Maize", baseUnit: "kg", tenantId: t2 } as never }),
    );
    expect(created.tenantId).toBe(t1);
  });

  it("scopes list and count reads to the active tenant", async () => {
    await runWithTenant({ tenantId: t2 }, () =>
      tenantDb().commodity.create({ data: { tenantId: t2, name: "Soya", baseUnit: "kg" } }),
    );

    const t1List = await runWithTenant({ tenantId: t1 }, () => tenantDb().commodity.findMany());
    expect(t1List.map((c) => c.name)).toEqual(["Maize"]);

    const t2Count = await runWithTenant({ tenantId: t2 }, () => tenantDb().commodity.count());
    expect(t2Count).toBe(1);
  });

  it("cannot read another tenant's row by id", async () => {
    const t2Row = await runWithTenant({ tenantId: t2 }, () =>
      tenantDb().commodity.create({ data: { tenantId: t2, name: "Cashew", baseUnit: "kg" } }),
    );

    const viaFindFirst = await runWithTenant({ tenantId: t1 }, () =>
      tenantDb().commodity.findFirst({ where: { id: t2Row.id } }),
    );
    expect(viaFindFirst).toBeNull();

    const viaFindUnique = await runWithTenant({ tenantId: t1 }, () =>
      tenantDb().commodity.findUnique({ where: { id: t2Row.id } }),
    );
    expect(viaFindUnique).toBeNull();
  });

  it("cannot delete another tenant's row", async () => {
    const t2Row = await runWithTenant({ tenantId: t2 }, () =>
      tenantDb().commodity.create({ data: { tenantId: t2, name: "Shea", baseUnit: "kg" } }),
    );

    await expect(
      runWithTenant({ tenantId: t1 }, () => tenantDb().commodity.delete({ where: { id: t2Row.id } })),
    ).rejects.toThrow();

    const stillThere = await runWithTenant({ tenantId: t2 }, () =>
      tenantDb().commodity.findUnique({ where: { id: t2Row.id } }),
    );
    expect(stillThere).not.toBeNull();
  });

  it("cannot update another tenant's row", async () => {
    const t2Row = await runWithTenant({ tenantId: t2 }, () =>
      tenantDb().commodity.create({ data: { tenantId: t2, name: "Rice", baseUnit: "kg" } }),
    );

    await expect(
      runWithTenant({ tenantId: t1 }, () =>
        tenantDb().commodity.update({ where: { id: t2Row.id }, data: { name: "Hijacked" } }),
      ),
    ).rejects.toThrow();

    const unchanged = await runWithTenant({ tenantId: t2 }, () =>
      tenantDb().commodity.findUniqueOrThrow({ where: { id: t2Row.id } }),
    );
    expect(unchanged.name).toBe("Rice");
  });

  it("scopes the new models (leads and lots) to the active tenant", async () => {
    await runWithTenant({ tenantId: t1 }, () =>
      tenantDb().lead.create({ data: { tenantId: t1, clientName: "Client A" } }),
    );
    await runWithTenant({ tenantId: t2 }, () =>
      tenantDb().lead.create({ data: { tenantId: t2, clientName: "Client B" } }),
    );
    const t1Leads = await runWithTenant({ tenantId: t1 }, () => tenantDb().lead.findMany());
    expect(t1Leads.map((l) => l.clientName)).toEqual(["Client A"]);

    await runWithTenant({ tenantId: t2 }, () =>
      tenantDb().inventoryLot.create({
        data: { tenantId: t2, reference: `LOT-${stamp}`, commodityName: "Maize", unit: "kg", netWeight: 10, remainingWeight: 10, costPerUnit: 1, totalCost: 10 },
      }),
    );
    const t1Lots = await runWithTenant({ tenantId: t1 }, () => tenantDb().inventoryLot.count());
    expect(t1Lots).toBe(0);
  });
});
