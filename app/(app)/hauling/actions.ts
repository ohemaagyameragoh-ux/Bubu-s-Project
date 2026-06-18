"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { HaulageStatus } from "@prisma/client";
import { createRequest, addQuote, bookQuote, updateRequestStatus } from "@/lib/services/hauling";

export type FormState = { error?: string; ok?: boolean };

const schema = z.object({
  pickup: z.string().trim().min(1, "Enter pickup."),
  dropoff: z.string().trim().min(1, "Enter drop-off."),
  commodityName: z.string().trim().min(1, "Enter commodity."),
  tonnage: z.coerce.number().positive("Enter tonnage."),
  vehicleType: z.string().trim().min(1, "Enter vehicle type."),
  pickupDate: z.string().optional(),
  commissionFeePct: z.coerce.number().min(0).max(100),
  chargeTo: z.string().optional(),
});

export async function createRequestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  try {
    await createRequest({
      pickup: parsed.data.pickup,
      dropoff: parsed.data.dropoff,
      commodityName: parsed.data.commodityName,
      tonnage: parsed.data.tonnage,
      vehicleType: parsed.data.vehicleType,
      pickupDate: parsed.data.pickupDate ? new Date(parsed.data.pickupDate) : null,
      commissionFeePct: parsed.data.commissionFeePct,
      chargeTo: parsed.data.chargeTo || "TRANSPORTER",
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not post the request." };
  }
  revalidatePath("/hauling");
  return { ok: true };
}

export async function addQuoteAction(formData: FormData): Promise<void> {
  const requestId = String(formData.get("requestId") ?? "");
  const transporterName = String(formData.get("transporterName") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const etaDaysRaw = String(formData.get("etaDays") ?? "");
  const note = String(formData.get("note") ?? "");
  if (requestId && transporterName && amount > 0) {
    await addQuote(requestId, transporterName, amount, etaDaysRaw ? Number(etaDaysRaw) : null, note);
  }
  revalidatePath("/hauling");
}

export async function bookQuoteAction(formData: FormData): Promise<void> {
  const requestId = String(formData.get("requestId") ?? "");
  const quoteId = String(formData.get("quoteId") ?? "");
  if (requestId && quoteId) await bookQuote(requestId, quoteId);
  revalidatePath("/hauling");
}

export async function updateRequestStatusAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const parsed = z.nativeEnum(HaulageStatus).safeParse(formData.get("status"));
  if (id && parsed.success) await updateRequestStatus(id, parsed.data);
  revalidatePath("/hauling");
}
