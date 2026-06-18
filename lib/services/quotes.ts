import { QuoteStatus } from "@prisma/client";
import { tenantDb } from "../tenant-db";
import { withTenantSession } from "../session";
import { requireTenantContext } from "../tenant-context";
import { recordAudit } from "../audit";
import { createWithReference } from "../reference";
import { createOrderInternal } from "./orders";

export type QuoteLineInput = {
  commodityName: string;
  grade?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
};

export type QuoteInput = {
  clientName: string;
  counterpartyId?: string | null;
  validUntil?: Date | null;
  deliveryTerms?: string;
  notes?: string;
  lines: QuoteLineInput[];
};

export async function listQuotes() {
  return withTenantSession(() =>
    tenantDb().quote.findMany({ orderBy: { createdAt: "desc" }, include: { lines: true } }),
  );
}

export async function getQuote(id: string) {
  return withTenantSession(() => tenantDb().quote.findFirst({ where: { id }, include: { lines: true } }));
}

export async function createQuote(input: QuoteInput) {
  return withTenantSession(async () => {
    const { tenantId } = requireTenantContext();
    const quote = await createWithReference(
      "QUO",
      () => tenantDb().quote.count(),
      (reference) =>
        tenantDb().quote.create({
          data: {
            tenantId,
            reference,
            clientName: input.clientName.trim(),
            counterpartyId: input.counterpartyId ?? null,
            validUntil: input.validUntil ?? null,
            deliveryTerms: input.deliveryTerms?.trim() ?? "",
            notes: input.notes?.trim() ?? "",
            lines: {
              create: input.lines.map((l) => ({
                tenantId,
                commodityName: l.commodityName.trim(),
                grade: l.grade?.trim() || null,
                quantity: l.quantity,
                unit: l.unit,
                unitPrice: l.unitPrice,
              })),
            },
          },
          include: { lines: true },
        }),
    );
    await recordAudit({ action: "quote.create", entity: "Quote", entityId: quote.id });
    return quote;
  });
}

export async function markQuoteSent(id: string) {
  return withTenantSession(async () => {
    const updated = await tenantDb().quote.update({
      where: { id },
      data: { status: QuoteStatus.SENT, sentAt: new Date() },
    });
    // Email sending is handled by the integration layer. Here we record that it was sent.
    await recordAudit({ action: "quote.send", entity: "Quote", entityId: id });
    return updated;
  });
}

// Accept a quote and turn each line into a confirmed order that drives sourcing and fulfillment.
export async function acceptQuote(id: string) {
  return withTenantSession(async () => {
    const quote = await tenantDb().quote.findFirst({ where: { id }, include: { lines: true } });
    if (!quote) throw new Error("Quote not found.");

    for (const line of quote.lines) {
      await createOrderInternal({
        clientName: quote.clientName,
        counterpartyId: quote.counterpartyId,
        commodityName: line.commodityName,
        grade: line.grade,
        quantity: line.quantity,
        unit: line.unit,
        agreedPrice: line.unitPrice,
        quoteId: quote.id,
      });
    }

    const updated = await tenantDb().quote.update({ where: { id }, data: { status: QuoteStatus.ACCEPTED } });
    await recordAudit({ action: "quote.accept", entity: "Quote", entityId: id, metadata: { orders: quote.lines.length } });
    return updated;
  });
}

export async function deleteQuote(id: string) {
  return withTenantSession(async () => {
    await tenantDb().quote.delete({ where: { id } });
    await recordAudit({ action: "quote.delete", entity: "Quote", entityId: id });
  });
}

export function quoteTotal(lines: { quantity: number; unitPrice: number }[]): number {
  return lines.reduce((a, l) => a + l.quantity * l.unitPrice, 0);
}
