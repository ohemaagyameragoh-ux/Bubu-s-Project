import { NextResponse } from "next/server";
import { z } from "zod";
import { PurchasePayMethod } from "@prisma/client";
import { getSessionUser } from "@/lib/session";
import { createPurchase } from "@/lib/services/purchases";

// Endpoint used by the field agent purchase screen. The screen queues purchases locally when
// offline and posts them here when a connection returns, so nothing is lost in the field.
const schema = z.object({
  farmerName: z.string().min(1),
  commodityName: z.string().min(1),
  grade: z.string().optional(),
  grossWeight: z.number().nonnegative(),
  deductions: z.number().nonnegative().optional(),
  unit: z.string().min(1),
  pricePerUnit: z.number().nonnegative(),
  payMethod: z.nativeEnum(PurchasePayMethod),
  paid: z.boolean(),
  location: z.string().optional(),
  moisture: z.number().optional(),
  foreignMatter: z.number().optional(),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid purchase" }, { status: 400 });
  const d = parsed.data;

  const created = await createPurchase({
    farmerName: d.farmerName,
    commodityName: d.commodityName,
    grade: d.grade,
    grossWeight: d.grossWeight,
    deductions: d.deductions ?? 0,
    unit: d.unit,
    pricePerUnit: d.pricePerUnit,
    payMethod: d.payMethod,
    paid: d.paid,
    location: d.location,
    qualityReadings: {
      ...(d.moisture != null ? { moisture: d.moisture } : {}),
      ...(d.foreignMatter != null ? { foreignMatter: d.foreignMatter } : {}),
    },
  });

  return NextResponse.json({ ok: true, reference: created.reference });
}
