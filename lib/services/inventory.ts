import { LotStatus } from "@prisma/client";
import { tenantDb } from "../tenant-db";
import { withTenantSession } from "../session";
import { requireTenantContext } from "../tenant-context";

export async function listLots() {
  return withTenantSession(() =>
    tenantDb().inventoryLot.findMany({ orderBy: [{ createdAt: "asc" }] }),
  );
}

// Stock on hand grouped by commodity and grade. On hand is simply everything bought minus
// everything shipped out, which is what remainingWeight already tracks per lot.
export async function stockByCommodity() {
  return withTenantSession(async () => {
    const lots = await tenantDb().inventoryLot.findMany({
      where: { status: { not: LotStatus.DISPATCHED } },
      orderBy: { createdAt: "asc" },
    });
    const map = new Map<string, { commodityName: string; grade: string; unit: string; onHand: number; lotCount: number; value: number; oldest: Date }>();
    for (const lot of lots) {
      const key = `${lot.commodityName}|${lot.grade ?? ""}`;
      const g = map.get(key) ?? {
        commodityName: lot.commodityName,
        grade: lot.grade ?? "",
        unit: lot.unit,
        onHand: 0,
        lotCount: 0,
        value: 0,
        oldest: lot.createdAt,
      };
      g.onHand += lot.remainingWeight;
      g.lotCount += 1;
      g.value += lot.remainingWeight * lot.costPerUnit;
      if (lot.createdAt < g.oldest) g.oldest = lot.createdAt;
      map.set(key, g);
    }
    return [...map.values()].sort((a, b) => a.commodityName.localeCompare(b.commodityName));
  });
}

// On hand for a single commodity and grade, used to compute the gap on a confirmed order.
export async function onHandFor(commodityName: string, grade?: string | null): Promise<number> {
  return withTenantSession(async () => {
    const lots = await tenantDb().inventoryLot.findMany({
      where: {
        commodityName,
        status: { not: LotStatus.DISPATCHED },
        ...(grade ? { grade } : {}),
      },
    });
    return lots.reduce((a, l) => a + l.remainingWeight, 0);
  });
}

// Create a lot directly (used by the farmer purchase flow). Expects an active tenant context.
export async function createLotInternal(input: {
  reference: string;
  commodityId?: string | null;
  commodityName: string;
  grade?: string | null;
  location?: string;
  unit: string;
  netWeight: number;
  costPerUnit: number;
  farmerId?: string | null;
  farmerName?: string | null;
  purchaseId?: string | null;
}) {
  const { tenantId } = requireTenantContext();
  return tenantDb().inventoryLot.create({
    data: {
      tenantId,
      reference: input.reference,
      commodityId: input.commodityId ?? null,
      commodityName: input.commodityName,
      grade: input.grade ?? null,
      location: input.location ?? "",
      unit: input.unit,
      netWeight: input.netWeight,
      remainingWeight: input.netWeight,
      costPerUnit: input.costPerUnit,
      totalCost: input.netWeight * input.costPerUnit,
      farmerId: input.farmerId ?? null,
      farmerName: input.farmerName ?? null,
      purchaseId: input.purchaseId ?? null,
    },
  });
}
