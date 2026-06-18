"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { LeadSource, LeadStage } from "@prisma/client";
import { createLead, updateLeadStage, deleteLead } from "@/lib/services/leads";

export type FormState = { error?: string; ok?: boolean };

const schema = z.object({
  clientName: z.string().trim().min(1, "Enter the client name."),
  commodityName: z.string().optional(),
  source: z.nativeEnum(LeadSource),
  estimatedValue: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? Number(v) : null)),
  message: z.string().optional(),
});

export async function createLeadAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  try {
    await createLead(parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save the lead." };
  }
  revalidatePath("/leads");
  return { ok: true };
}

export async function moveLeadAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const parsed = z.nativeEnum(LeadStage).safeParse(formData.get("stage"));
  if (!id || !parsed.success) return;
  await updateLeadStage(id, parsed.data);
  revalidatePath("/leads");
}

export async function deleteLeadAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteLead(id);
  revalidatePath("/leads");
}
