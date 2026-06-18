"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createTrip, markTripInTransit, markTripDelivered } from "@/lib/services/trips";

export type FormState = { error?: string };

const schema = z.object({
  commodityName: z.string().trim().min(1, "Enter the commodity."),
  truck: z.string().trim().min(1, "Enter the truck."),
  driver: z.string().trim().min(1, "Enter the driver."),
  transporterName: z.string().optional(),
  freightRate: z.string().optional(),
  weighbridgeIn: z.string().optional(),
  weighbridgeOut: z.string().optional(),
  bagCount: z.string().optional(),
  sealNumber: z.string().optional(),
});

const optNum = (v: FormDataEntryValue | null) => (v && String(v).trim() !== "" ? Number(v) : null);

export async function createTripAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const selected = formData.getAll("lotSel").map(String);
  const lots = selected
    .map((id) => ({ lotId: id, weight: Number(formData.get(`weight_${id}`) ?? 0) }))
    .filter((l) => l.weight > 0);

  if (lots.length === 0) return { error: "Select at least one lot to load." };

  let trip;
  try {
    trip = await createTrip({
      commodityName: parsed.data.commodityName,
      truck: parsed.data.truck,
      driver: parsed.data.driver,
      transporterName: parsed.data.transporterName,
      freightRate: optNum(formData.get("freightRate")),
      weighbridgeIn: optNum(formData.get("weighbridgeIn")),
      weighbridgeOut: optNum(formData.get("weighbridgeOut")),
      bagCount: optNum(formData.get("bagCount")),
      sealNumber: parsed.data.sealNumber,
      lots,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create the trip." };
  }

  revalidatePath("/logistics");
  revalidatePath("/stock");
  redirect(`/logistics/${trip.id}`);
}

export async function inTransitAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const departureAt = formData.get("departureAt") ? new Date(String(formData.get("departureAt"))) : null;
  const etaAt = formData.get("etaAt") ? new Date(String(formData.get("etaAt"))) : null;
  if (id) await markTripInTransit(id, departureAt, etaAt);
  revalidatePath(`/logistics/${id}`);
  revalidatePath("/logistics");
}

export async function deliveredAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await markTripDelivered(id, {
    receivedWeight: Number(formData.get("receivedWeight") ?? 0),
    sealIntact: formData.get("sealIntact") === "on",
    clientSignoff: String(formData.get("clientSignoff") ?? ""),
    actualFreight: optNum(formData.get("actualFreight")),
    tripExpenses: optNum(formData.get("tripExpenses")),
    delay: String(formData.get("delay") ?? ""),
  });
  revalidatePath(`/logistics/${id}`);
  revalidatePath("/logistics");
}
