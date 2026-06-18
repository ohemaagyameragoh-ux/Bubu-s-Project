"use server";

import { revalidatePath } from "next/cache";
import { updateTenantPlan } from "@/lib/services/operator";

export async function updateTenantPlanAction(formData: FormData): Promise<void> {
  const tenantId = String(formData.get("tenantId") ?? "");
  const plan = String(formData.get("plan") ?? "free");
  if (tenantId) await updateTenantPlan(tenantId, plan);
  revalidatePath("/operator");
}
