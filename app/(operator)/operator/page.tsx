import { listTenantsOverview, platformEarnings } from "@/lib/services/operator";
import { formatMoney, formatDate } from "@/lib/format";
import { Card, StatCard, Badge, PageHeader } from "@/components/ui";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import { updateTenantPlanAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function OperatorPage() {
  const [tenants, earnings] = await Promise.all([listTenantsOverview(), platformEarnings()]);

  return (
    <div>
      <PageHeader title="Operator overview" subtitle="Oversight of every workspace and the platform's own earnings. This view is never visible to traders." />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total platform earnings" value={formatMoney(earnings.total)} accent="forest" />
        <StatCard label="Marketplace margin" value={formatMoney(earnings.marketplaceMargin)} accent="ocean" />
        <StatCard label="Freight commission" value={formatMoney(earnings.freightCommission)} accent="ocean" />
        <StatCard label="Workspaces" value={String(tenants.length)} />
      </div>

      <h2 className="mb-3 text-sm font-medium text-ink">Workspaces</h2>
      <div className="mb-10 overflow-hidden rounded-2xl border border-line bg-card shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-tan/60 text-left">
              <th className="px-4 py-3 label-caps">Workspace</th>
              <th className="px-4 py-3 label-caps">Users</th>
              <th className="px-4 py-3 label-caps">Trades</th>
              <th className="px-4 py-3 label-caps">Invoices</th>
              <th className="px-4 py-3 label-caps">Plan</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{t.name}</div>
                  <div className="text-xs text-muted">{t.slug} · joined {formatDate(t.createdAt)}</div>
                </td>
                <td className="px-4 py-3 text-ink">{t._count.users}</td>
                <td className="px-4 py-3 text-ink">{t._count.transactions}</td>
                <td className="px-4 py-3 text-ink">{t._count.invoices}</td>
                <td className="px-4 py-3">
                  <form action={updateTenantPlanAction} className="flex items-center gap-2">
                    <input type="hidden" name="tenantId" value={t.id} />
                    <AutoSubmitSelect
                      name="plan"
                      defaultValue={t.plan}
                      options={[
                        { value: "free", label: "free" },
                        { value: "pro", label: "pro" },
                        { value: "enterprise", label: "enterprise" },
                      ]}
                    />
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-sm font-medium text-ink">Internal operations ledger</h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-tan/60 text-left">
              <th className="px-4 py-3 label-caps">Date</th>
              <th className="px-4 py-3 label-caps">Source</th>
              <th className="px-4 py-3 label-caps">Description</th>
              <th className="px-4 py-3 label-caps text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {earnings.entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  No platform earnings recorded yet. They appear from marketplace matches and freight bookings.
                </td>
              </tr>
            ) : (
              earnings.entries.map((e) => (
                <tr key={e.id} className="border-t border-line">
                  <td className="px-4 py-3 text-muted">{formatDate(e.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Badge tone="blue">{e.source.replace("_", " ").toLowerCase()}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink">{e.description}</td>
                  <td className="px-4 py-3 text-right text-ink">{formatMoney(e.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
