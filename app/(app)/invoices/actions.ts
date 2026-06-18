"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createInvoice, markInvoiceSent, recordInvoicePayment, deleteInvoice } from "@/lib/services/invoices";

export type FormState = { error?: string };

const schema = z.object({
  clientName: z.string().trim().min(1, "Enter the client."),
  dueDate: z.string().optional(),
  creditTerms: z.string().optional(),
  notes: z.string().optional(),
});

export async function createInvoiceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse({
    clientName: formData.get("clientName"),
    dueDate: formData.get("dueDate"),
    creditTerms: formData.get("creditTerms"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const descs = formData.getAll("lineDesc").map(String);
  const qtys = formData.getAll("lineQty").map(String);
  const units = formData.getAll("lineUnit").map(String);
  const prices = formData.getAll("linePrice").map(String);

  const lines = descs
    .map((description, i) => ({
      description: description.trim(),
      quantity: Number(qtys[i] ?? 0),
      unit: (units[i] ?? "MT").trim() || "MT",
      unitPrice: Number(prices[i] ?? 0),
    }))
    .filter((l) => l.description && l.quantity > 0);

  if (lines.length === 0) return { error: "Add at least one line item." };

  try {
    await createInvoice({
      clientName: parsed.data.clientName,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      creditTerms: parsed.data.creditTerms,
      notes: parsed.data.notes,
      lines,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create the invoice." };
  }

  revalidatePath("/invoices");
  redirect("/invoices");
}

export async function sendInvoiceAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) await markInvoiceSent(id);
  revalidatePath("/invoices");
}

export async function recordPaymentAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const method = String(formData.get("method") ?? "Mobile money");
  const reference = String(formData.get("reference") ?? "");
  if (id && amount > 0) await recordInvoicePayment(id, amount, method, reference);
  revalidatePath("/invoices");
}

export async function deleteInvoiceAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) await deleteInvoice(id);
  revalidatePath("/invoices");
}
