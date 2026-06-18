"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createCommodity, deleteCommodity } from "@/lib/services/commodities";

export type FormState = { error?: string; ok?: boolean };

const schema = z.object({
  name: z.string().trim().min(1, "Enter a commodity name."),
  description: z.string().trim().optional(),
  baseUnit: z.string().trim().min(1, "Enter a base unit (for example kg)."),
});

export async function createCommodityAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    baseUnit: formData.get("baseUnit"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  // Units come in as a comma separated list. Grades and quality params arrive as parallel arrays.
  const units = String(formData.get("units") ?? "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);

  const gradeNames = formData.getAll("gradeName").map(String);
  const gradeDescs = formData.getAll("gradeDescription").map(String);
  const grades = gradeNames
    .map((name, i) => ({ name: name.trim(), description: (gradeDescs[i] ?? "").trim() }))
    .filter((g) => g.name.length > 0);

  const qpNames = formData.getAll("qpName").map(String);
  const qpUnits = formData.getAll("qpUnit").map(String);
  const qpMax = formData.getAll("qpMax").map(String);
  const qualityParams = qpNames
    .map((name, i) => {
      const maxRaw = (qpMax[i] ?? "").trim();
      const maxAcceptable = maxRaw === "" ? null : Number(maxRaw);
      return {
        name: name.trim(),
        unit: (qpUnits[i] ?? "").trim() || "%",
        maxAcceptable: Number.isFinite(maxAcceptable as number) ? (maxAcceptable as number) : null,
      };
    })
    .filter((q) => q.name.length > 0);

  try {
    await createCommodity({
      name: parsed.data.name,
      description: parsed.data.description,
      baseUnit: parsed.data.baseUnit,
      units: units.length ? units : [parsed.data.baseUnit],
      grades,
      qualityParams,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add the commodity.";
    // Surface the common duplicate-name case in plain language.
    if (message.includes("Unique constraint")) {
      return { error: "You already have a commodity with that name." };
    }
    return { error: message };
  }

  revalidatePath("/settings/commodities");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteCommodityAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteCommodity(id);
  revalidatePath("/settings/commodities");
  revalidatePath("/dashboard");
}
