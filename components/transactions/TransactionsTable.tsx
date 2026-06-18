import Link from "next/link";
import type { Transaction } from "@prisma/client";
import { commodityIcon } from "@/lib/commodity-icon";
import { formatMoney, formatQuantity, formatDate } from "@/lib/format";
import { transactionValue } from "@/lib/transaction-value";
import { RoleBadge, StatusBadge } from "@/components/ui";
import { RowStatusControls } from "@/components/transactions/RowStatusControls";

export function TransactionsTable({
  rows,
  editable = false,
  emptyHint = "No transactions yet.",
}: {
  rows: Transaction[];
  editable?: boolean;
  emptyHint?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-card p-10 text-center text-muted shadow-card">{emptyHint}</div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-tan/60 text-left">
              <Th>Reference</Th>
              <Th>Commodity</Th>
              <Th>Role</Th>
              <Th>Qty / Value</Th>
              <Th>Counterparty</Th>
              <Th>{editable ? "Payment / Delivery / Lifecycle" : "State"}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-t border-line align-top">
                <td className="px-4 py-4">
                  <Link href={`/transactions`} className="font-medium text-ink no-underline">
                    {t.reference}
                  </Link>
                  <div className="mt-0.5 text-xs text-muted">{formatDate(t.tradeDate)}</div>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden>{commodityIcon(t.commodityName)}</span>
                    <span className="text-ink">{t.commodityName}</span>
                  </span>
                  {t.grade ? <div className="mt-0.5 text-xs text-muted">{t.grade}</div> : null}
                </td>
                <td className="px-4 py-4">
                  <RoleBadge mode={t.mode} />
                </td>
                <td className="px-4 py-4">
                  <div className="text-ink">{formatQuantity(t.quantity, t.unit)}</div>
                  <div className="mt-0.5 text-xs text-muted">{formatMoney(transactionValue(t))}</div>
                </td>
                <td className="px-4 py-4 text-ink">{t.counterparty}</td>
                <td className="px-4 py-4">
                  {editable ? (
                    <RowStatusControls
                      id={t.id}
                      paymentStatus={t.paymentStatus}
                      deliveryStatus={t.deliveryStatus}
                      statusOverride={t.statusOverride}
                    />
                  ) : (
                    <StatusBadge status={t.status} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 label-caps font-semibold">{children}</th>;
}
