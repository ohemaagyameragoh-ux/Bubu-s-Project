"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ListingType } from "@prisma/client";
import { createListing, makeOffer, acceptOffer, raiseDispute } from "@/lib/services/marketplace";

export type FormState = { error?: string; ok?: boolean };

const listingSchema = z.object({
  type: z.nativeEnum(ListingType),
  commodityName: z.string().trim().min(1, "Enter the commodity."),
  grade: z.string().optional(),
  quantity: z.coerce.number().positive("Enter a quantity."),
  unit: z.string().trim().min(1, "Enter a unit."),
  price: z.coerce.number().min(0, "Enter a price."),
  region: z.string().optional(),
  note: z.string().optional(),
});

export async function createListingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = listingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  try {
    await createListing(parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not post the listing." };
  }
  revalidatePath("/marketplace");
  return { ok: true };
}

export async function makeOfferAction(formData: FormData): Promise<void> {
  const listingId = String(formData.get("listingId") ?? "");
  const price = Number(formData.get("price") ?? 0);
  const quantity = Number(formData.get("quantity") ?? 0);
  const message = String(formData.get("message") ?? "");
  if (listingId && price >= 0 && quantity > 0) {
    try {
      await makeOffer(listingId, price, quantity, message);
    } catch {
      // Ignored: invalid offers (for example on your own listing) are simply not created.
    }
  }
  revalidatePath("/marketplace");
}

export async function acceptOfferAction(formData: FormData): Promise<void> {
  const offerId = String(formData.get("offerId") ?? "");
  if (offerId) await acceptOffer(offerId);
  revalidatePath("/marketplace");
  revalidatePath("/transactions");
}

export async function disputeAction(formData: FormData): Promise<void> {
  const againstTenantId = String(formData.get("againstTenantId") ?? "");
  const listingId = String(formData.get("listingId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  if (againstTenantId) await raiseDispute(againstTenantId, listingId, reason);
  revalidatePath("/marketplace");
}
