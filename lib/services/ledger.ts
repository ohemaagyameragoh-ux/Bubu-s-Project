import { LedgerType, InvoiceStatus } from "@prisma/client";
import { tenantDb } from "../tenant-db";
import { withTenantSession } from "../session";
import { requireTenantContext } from "../tenant-context";

// Low level posting. Call this from inside another tenant session (for example when a farmer
// purchase or an invoice payment happens). The scoped client pins tenantId; we pass it too so
// the types are satisfied.
export async function postLedger(input: {
  date?: Date;
  type: LedgerType;
  category: string;
  description?: string;
  amount: number;
  refEntity?: string;
  refId?: string;
}) {
  const { tenantId } = requireTenantContext();
  return tenantDb().ledgerEntry.create({
    data: {
      tenantId,
      date: input.date ?? new Date(),
      type: input.type,
      category: input.category,
      description: input.description ?? "",
      amount: input.amount,
      refEntity: input.refEntity ?? null,
      refId: input.refId ?? null,
    },
  });
}

export async function listLedger() {
  return withTenantSession(() => tenantDb().ledgerEntry.findMany({ orderBy: { date: "desc" } }));
}

export async function ledgerSummary() {
  return withTenantSession(async () => {
    const db = tenantDb();
    const [entries, invoices, purchases] = await Promise.all([
      db.ledgerEntry.findMany(),
      db.invoice.findMany(),
      db.farmerPurchase.findMany(),
    ]);

    const sum = (type: LedgerType) =>
      entries.filter((e) => e.type === type).reduce((a, e) => a + e.amount, 0);

    const revenue = sum(LedgerType.REVENUE);
    const cogs = sum(LedgerType.COGS);
    const expense = sum(LedgerType.EXPENSE);

    // Receivables: invoiced money not yet collected. Payables: farmer purchases not yet paid.
    const receivables = invoices
      .filter((i) => i.status !== InvoiceStatus.PAID && i.status !== InvoiceStatus.CANCELLED)
      .reduce((a, i) => a + (i.amount - i.paidAmount), 0);
    const payables = purchases.filter((p) => !p.paid).reduce((a, p) => a + p.totalCost, 0);

    return { revenue, cogs, expense, profit: revenue - cogs - expense, receivables, payables };
  });
}
