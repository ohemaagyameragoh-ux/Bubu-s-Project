"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { IntegrationKind } from "@prisma/client";
import { upsertIntegration } from "@/lib/services/integrations";

export type FormState = { error?: string; ok?: boolean };

const schema = z.object({
  kind: z.nativeEnum(IntegrationKind),
  label: z.string().optional(),
  credential: z.string().optional(),
  connected: z.string().optional(),
});

export async function upsertIntegrationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Could not save." };
  try {
    await upsertIntegration(
      parsed.data.kind,
      parsed.data.label ?? "",
      { credential: parsed.data.credential ?? "" },
      parsed.data.connected === "on",
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save." };
  }
  revalidatePath("/settings/integrations");
  return { ok: true };
}
