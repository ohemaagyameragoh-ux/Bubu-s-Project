"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { createOrder, updateOrderStatus } from "@/lib/services/orders";

export type FormState = { error?: string; ok?: boolean };

const schema = z.object({
  clientName: z.string().trim().min(1, "Enter the client."),
  commodityName: z.string().trim().min(1, "Enter the commodity."),
  grade: z.string().optional(),
  quantity: z.coerce.number().positive("Enter a quantity."),
  unit: z.string().trim().min(1, "Enter a unit."),
  agreedPrice: z.coerce.number().min(0, "Enter a price."),
});

export async function createOrderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  try {
    await createOrder(parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create the order." };
  }
  revalidatePath("/orders");
  return { ok: true };
}

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const parsed = z.nativeEnum(OrderStatus).safeParse(formData.get("status"));
  if (!id || !parsed.success) return;
  await updateOrderStatus(id, parsed.data);
  revalidatePath("/orders");
}
