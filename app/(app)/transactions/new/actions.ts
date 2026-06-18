"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TradeMode, PaymentStatus, DeliveryStatus } from "@prisma/client";
import { createTransaction } from "@/lib/services/transactions";

export type FormState = { error?: string };

const optionalNumber = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? Number(v) : null))
  .refine((v) => v === null || (Number.isFinite(v) && v >= 0), "Enter a valid amount.");

const schema = z.object({
  mode: z.nativeEnum(TradeMode),
  commodityId: z.string().min(1, "Choose a commodity."),
  grade: z.string().optional(),
  quantity: z.coerce.number().positive("Enter a quantity greater than zero."),
  unit: z.string().min(1, "Choose a unit."),
  counterparty: z.string().trim().min(1, "Enter the other party (buyer or seller)."),
  tradeDate: z.coerce.date(),
  notes: z.string().optional(),
  buyPrice: optionalNumber,
  sellPrice: optionalNumber,
  capitalSource: z.string().optional(),
  commission: optionalNumber,
  paymentStatus: z.nativeEnum(PaymentStatus),
  deliveryStatus: z.nativeEnum(DeliveryStatus),
});

export async function createTransactionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const d = parsed.data;

  try {
    await createTransaction({
      mode: d.mode,
      commodityId: d.commodityId,
      grade: d.grade,
      quantity: d.quantity,
      unit: d.unit,
      counterparty: d.counterparty,
      tradeDate: d.tradeDate,
      notes: d.notes,
      buyPrice: d.buyPrice,
      sellPrice: d.sellPrice,
      capitalSource: d.capitalSource,
      commission: d.commission,
      paymentStatus: d.paymentStatus,
      deliveryStatus: d.deliveryStatus,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not record the trade." };
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  redirect("/transactions");
}
