import { TradeMode } from "@prisma/client";

// The headline value shown for a trade in lists. For an owner trade it is the trade value
// (sell price if known, otherwise buy price, times quantity). For a broker trade the money the
// trader actually sees is the commission, so that is what we surface.
export function transactionValue(t: {
  mode: TradeMode;
  quantity: number;
  buyPrice: number | null;
  sellPrice: number | null;
  commission: number | null;
}): number {
  if (t.mode === TradeMode.OWNER) {
    const price = t.sellPrice ?? t.buyPrice ?? 0;
    return price * t.quantity;
  }
  return t.commission ?? 0;
}
