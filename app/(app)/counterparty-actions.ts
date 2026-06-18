"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CounterpartyType } from "@prisma/client";
import { createCounterparty, deleteCounterparty } from "@/lib/services/counterparties";

export type FormState = { error?: string; ok?: boolean };

const schema = z.object({
  type: z.nativeEnum(CounterpartyType),
  name: z.string().trim().min(1, "Enter a name."),
  phone: z.string().optional(),
  email: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export async function addCounterpartyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  try {
    await createCounterparty(parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save." };
  }
  revalidatePath("/clients");
  revalidatePath("/farmers");
  return { ok: true };
}

export async function deleteCounterpartyAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteCounterparty(id);
  revalidatePath("/clients");
  revalidatePath("/farmers");
}
