"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PaymentStatus, DeliveryStatus, Lifecycle } from "@prisma/client";
import { updateTransactionStatus } from "@/lib/services/transactions";

const schema = z.object({
  id: z.string().min(1),
  paymentStatus: z.nativeEnum(PaymentStatus),
  deliveryStatus: z.nativeEnum(DeliveryStatus),
  // AUTO clears the manual override and returns to the derived lifecycle.
  statusOverride: z.union([z.literal("AUTO"), z.nativeEnum(Lifecycle)]),
});

export async function updateStatusAction(formData: FormData): Promise<void> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { id, paymentStatus, deliveryStatus, statusOverride } = parsed.data;

  await updateTransactionStatus(id, {
    paymentStatus,
    deliveryStatus,
    statusOverride: statusOverride === "AUTO" ? null : statusOverride,
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}
