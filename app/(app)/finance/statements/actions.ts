"use server";

import { revalidatePath } from "next/cache";
import { uploadStatement } from "@/lib/services/statements";

export type FormState = { error?: string; ok?: boolean };

export async function uploadStatementAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const fileName = String(formData.get("fileName") ?? "statement.csv");
  const account = String(formData.get("account") ?? "");
  const csvText = String(formData.get("csvText") ?? "");
  if (!csvText.trim()) return { error: "Paste or upload statement lines first." };

  try {
    await uploadStatement(fileName, account, csvText);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not analyze the statement." };
  }
  revalidatePath("/finance/statements");
  return { ok: true };
}
