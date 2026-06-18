import { LedgerType, PaymentDirection, PurchasePayMethod } from "@prisma/client";
import { tenantDb } from "../tenant-db";
import { withTenantSession } from "../session";
import { requireTenantContext } from "../tenant-context";
import { recordAudit } from "../audit";
import { createWithReference } from "../reference";
import { createLotInternal } from "./inventory";
import { postLedger } from "./ledger";

export type PurchaseInput = {
  farmerName: string;
  farmerId?: string | null;
  commodityName: string;
  commodityId?: string | null;
  grade?: string;
  grossWeight: number;
  deductions?: number;
  unit: string;
  pricePerUnit: number;
  payMethod: PurchasePayMethod;
  paid: boolean;
  location?: string;
  qualityReadings?: Record<string, unknown>;
  receiptRef?: string;
};

export async function listPurchases() {
  return withTenantSession(() => tenantDb().farmerPurchase.findMany({ orderBy: { createdAt: "desc" } }));
}

export async function createPurchase(input: PurchaseInput) {
  return withTenantSession(async () => {
    const { tenantId, userId } = requireTenantContext();
    const net = Math.max(0, input.grossWeight - (input.deductions ?? 0));
    const total = net * input.pricePerUnit;

    const purchase = await createWithReference(
      "PUR",
      () => tenantDb().farmerPurchase.count(),
      (reference) =>
        tenantDb().farmerPurchase.create({
          data: {
            tenantId,
            reference,
            farmerName: input.farmerName.trim(),
            farmerId: input.farmerId ?? null,
            commodityName: input.commodityName.trim(),
            commodityId: input.commodityId ?? null,
            grade: input.grade?.trim() || null,
            grossWeight: input.grossWeight,
            deductions: input.deductions ?? 0,
            netWeight: net,
            unit: input.unit,
            pricePerUnit: input.pricePerUnit,
            totalCost: total,
            payMethod: input.payMethod,
            paid: input.paid,
            location: input.location?.trim() ?? "",
            receiptRef: input.receiptRef?.trim() || (input.paid ? `RCPT-${reference}` : null),
            qualityReadings: (input.qualityReadings ?? undefined) as object | undefined,
          },
        }),
    );

    // Each purchase becomes a tracked lot, tagged with farmer, grade, weight, and cost.
    await createWithReference(
      "LOT",
      () => tenantDb().inventoryLot.count(),
      (reference) =>
        createLotInternal({
          reference,
          commodityId: input.commodityId,
          commodityName: input.commodityName.trim(),
          grade: input.grade,
          location: input.location,
          unit: input.unit,
          netWeight: net,
          costPerUnit: input.pricePerUnit,
          farmerId: input.farmerId,
          farmerName: input.farmerName.trim(),
          purchaseId: purchase.id,
        }),
    );

    // The books fill themselves: a purchase is cost of goods.
    await postLedger({
      type: LedgerType.COGS,
      category: "Farmer purchase",
      amount: total,
      description: `${net} ${input.unit} ${input.commodityName} from ${input.farmerName}`,
      refEntity: "FarmerPurchase",
      refId: purchase.id,
    });

    // Money only moves on an explicit user action. Recording a paid purchase is that action, so
    // we log a payment out with a receipt. We never auto-execute a payout on our own.
    if (input.paid) {
      await tenantDb().payment.create({
        data: {
          tenantId,
          direction: PaymentDirection.OUT,
          amount: total,
          method: input.payMethod,
          reference: purchase.receiptRef ?? purchase.reference,
          purchaseId: purchase.id,
          confirmedByUserId: userId ?? null,
        },
      });
    }

    await recordAudit({
      action: "purchase.create",
      entity: "FarmerPurchase",
      entityId: purchase.id,
      metadata: { paid: input.paid, total },
    });
    return purchase;
  });
}
