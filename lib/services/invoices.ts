import { InvoiceStatus, LedgerType, PaymentDirection } from "@prisma/client";
import { tenantDb } from "../tenant-db";
import { withTenantSession } from "../session";
import { requireTenantContext } from "../tenant-context";
import { recordAudit } from "../audit";
import { createWithReference } from "../reference";
import { postLedger } from "./ledger";

export type InvoiceLineInput = { description: string; quantity: number; unit: string; unitPrice: number };

export type InvoiceInput = {
  clientName: string;
  counterpartyId?: string | null;
  orderId?: string | null;
  dueDate?: Date | null;
  creditTerms?: string;
  notes?: string;
  lines: InvoiceLineInput[];
};

export async function listInvoices() {
  return withTenantSession(() =>
    tenantDb().invoice.findMany({ orderBy: { createdAt: "desc" }, include: { lines: true } }),
  );
}

export async function getInvoice(id: string) {
  return withTenantSession(() =>
    tenantDb().invoice.findFirst({ where: { id }, include: { lines: true, payments: true } }),
  );
}

export async function createInvoice(input: InvoiceInput) {
  return withTenantSession(async () => {
    const { tenantId } = requireTenantContext();
    const amount = input.lines.reduce((a, l) => a + l.quantity * l.unitPrice, 0);

    const invoice = await createWithReference(
      "INV",
      () => tenantDb().invoice.count(),
      (reference) =>
        tenantDb().invoice.create({
          data: {
            tenantId,
            reference,
            clientName: input.clientName.trim(),
            counterpartyId: input.counterpartyId ?? null,
            orderId: input.orderId ?? null,
            amount,
            dueDate: input.dueDate ?? null,
            creditTerms: input.creditTerms?.trim() ?? "",
            notes: input.notes?.trim() ?? "",
            lines: {
              create: input.lines.map((l) => ({
                tenantId,
                description: l.description.trim(),
                quantity: l.quantity,
                unit: l.unit,
                unitPrice: l.unitPrice,
              })),
            },
          },
          include: { lines: true },
        }),
    );
    await recordAudit({ action: "invoice.create", entity: "Invoice", entityId: invoice.id });
    return invoice;
  });
}

export async function markInvoiceSent(id: string) {
  return withTenantSession(async () => {
    const updated = await tenantDb().invoice.update({
      where: { id },
      data: { status: InvoiceStatus.SENT, sentAt: new Date() },
    });
    await recordAudit({ action: "invoice.send", entity: "Invoice", entityId: id });
    return updated;
  });
}

// Record a client payment. This is always an explicit user action: finance marks money received,
// the system never books it on its own. Part payments and credit terms are supported.
export async function recordInvoicePayment(id: string, amount: number, method: string, reference: string) {
  return withTenantSession(async () => {
    const { tenantId, userId } = requireTenantContext();
    const invoice = await tenantDb().invoice.findFirst({ where: { id } });
    if (!invoice) throw new Error("Invoice not found.");

    const newPaid = invoice.paidAmount + amount;
    const status = newPaid >= invoice.amount ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;

    await tenantDb().invoice.update({ where: { id }, data: { paidAmount: newPaid, status } });
    await tenantDb().payment.create({
      data: {
        tenantId,
        invoiceId: id,
        direction: PaymentDirection.IN,
        amount,
        method,
        reference,
        confirmedByUserId: userId ?? null,
      },
    });
    await postLedger({
      type: LedgerType.REVENUE,
      category: "Client payment",
      amount,
      description: `Payment for ${invoice.reference} from ${invoice.clientName}`,
      refEntity: "Invoice",
      refId: id,
    });
    await recordAudit({ action: "invoice.payment", entity: "Invoice", entityId: id, metadata: { amount, status } });
    return { status, paidAmount: newPaid };
  });
}

export async function deleteInvoice(id: string) {
  return withTenantSession(async () => {
    await tenantDb().invoice.delete({ where: { id } });
    await recordAudit({ action: "invoice.delete", entity: "Invoice", entityId: id });
  });
}
