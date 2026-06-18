"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateBranding } from "@/lib/services/workspace";

export type FormState = { error?: string; ok?: boolean };

const schema = z.object({
  name: z.string().trim().min(2, "Enter your business name."),
  legalName: z.string().trim().optional(),
  logoUrl: z.string().trim().url("Enter a valid URL.").or(z.literal("")).optional(),
  email: z.string().trim().email("Enter a valid email.").or(z.literal("")).optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  currency: z.string().trim().max(8).optional(),
});

export async function updateBrandingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    legalName: formData.get("legalName"),
    logoUrl: formData.get("logoUrl"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    currency: formData.get("currency"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  try {
    await updateBranding(parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save." };
  }

  revalidatePath("/settings/workspace");
  revalidatePath("/dashboard");
  return { ok: true };
}
