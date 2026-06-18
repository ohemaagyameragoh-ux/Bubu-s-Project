import { Lifecycle, PaymentStatus, DeliveryStatus } from "@prisma/client";

// The single source of truth for a trade's lifecycle. A manual override always wins. Otherwise:
// paid and delivered is Completed, nothing started (unpaid and pending) is Pending, and anything
// in between is Active. Cancelled is only ever reached through an explicit override.
export function deriveStatus(
  paymentStatus: PaymentStatus,
  deliveryStatus: DeliveryStatus,
  override?: Lifecycle | null,
): Lifecycle {
  if (override) return override;
  if (paymentStatus === PaymentStatus.PAID && deliveryStatus === DeliveryStatus.DELIVERED) {
    return Lifecycle.COMPLETED;
  }
  if (paymentStatus === PaymentStatus.UNPAID && deliveryStatus === DeliveryStatus.PENDING) {
    return Lifecycle.PENDING;
  }
  return Lifecycle.ACTIVE;
}

// Profit on an owner trade. Prices are per unit. A missing price counts as zero, so a half
// recorded trade still shows a sensible running number.
export function ownerProfit(quantity: number, buyPrice: number | null, sellPrice: number | null) {
  const revenue = (sellPrice ?? 0) * quantity;
  const cost = (buyPrice ?? 0) * quantity;
  return { revenue, cost, profit: revenue - cost };
}
