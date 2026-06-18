"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createQuote, markQuoteSent, acceptQuote, deleteQuote } from "@/lib/services/quotes";

export type FormState = { error?: string };

const schema = z.object({
  clientName: z.string().trim().min(1, "Enter the client."),
  validUntil: z.string().optional(),
  deliveryTerms: z.string().optional(),
  notes: z.string().optional(),
});

export async function createQuoteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse({
    clientName: formData.get("clientName"),
    validUntil: formData.get("validUntil"),
    deliveryTerms: formData.get("deliveryTerms"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const names = formData.getAll("lineCommodity").map(String);
  const grades = formData.getAll("lineGrade").map(String);
  const qtys = formData.getAll("lineQty").map(String);
  const units = formData.getAll("lineUnit").map(String);
  const prices = formData.getAll("linePrice").map(String);

  const lines = names
    .map((name, i) => ({
      commodityName: name.trim(),
      grade: (grades[i] ?? "").trim(),
      quantity: Number(qtys[i] ?? 0),
      unit: (units[i] ?? "kg").trim() || "kg",
      unitPrice: Number(prices[i] ?? 0),
    }))
    .filter((l) => l.commodityName && l.quantity > 0);

  if (lines.length === 0) return { error: "Add at least one line with a commodity and quantity." };

  try {
    await createQuote({
      clientName: parsed.data.clientName,
      validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
      deliveryTerms: parsed.data.deliveryTerms,
      notes: parsed.data.notes,
      lines,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create the quote." };
  }

  revalidatePath("/quotes");
  redirect("/quotes");
}

export async function sendQuoteAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) await markQuoteSent(id);
  revalidatePath("/quotes");
}

export async function acceptQuoteAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) await acceptQuote(id);
  revalidatePath("/quotes");
  revalidatePath("/orders");
}

export async function deleteQuoteAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) await deleteQuote(id);
  revalidatePath("/quotes");
}
