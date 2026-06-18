import Link from "next/link";
import { ownerPnlReport, brokerCommissionReport } from "@/lib/services/reports";
import { formatMoney, formatQuantity, formatDate } from "@/lib/format";
import { Card, StatCard } from "@/components/ui";

export const dynamic = "force-dynamic";

const VIEWS = [
  { key: "owner", label: "Owner profit and loss" },
  { key: "broker", label: "Broker commission" },
] as const;

export default async function ReportsPage({ searchParams }: { searchParams: { view?: string } }) {
  const view = searchParams.view === "broker" ? "broker" : "owner";

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Reports</h1>
          <p className="mt-2 text-muted">
            Two separate buckets, never mixed: profit and loss on the trades you own, and income on the
            trades you broker.
          </p>
        </div>
        <Link href={`/reports/export?type=${view}`} className="no-underline">
          <span className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink hover:border-clay/40">
            Export CSV
          </span>
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-6 border-b border-line">
        {VIEWS.map((v) => {
          const isActive = v.key === view;
          return (
            <Link
              key={v.key}
              href={`/reports?view=${v.key}`}
              className={
                "no-underline -mb-px border-b-2 px-1 pb-3 text-sm font-medium " +
                (isActive ? "border-clay text-ink" : "border-transparent text-muted hover:text-ink")
              }
            >
              {v.label}
            </Link>
          );
        })}
      </div>

      {view === "owner" ? <OwnerReport /> : <BrokerReport />}
    </div>
  );
}

async function OwnerReport() {
  const report = await ownerPnlReport();
  return (
    <div>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Owner trades" value={String(report.totals.count)} />
        <StatCard label="Revenue" value={formatMoney(report.totals.revenue)} />
        <StatCard label="Cost" value={formatMoney(report.totals.cost)} />
        <StatCard label="Net profit" value={formatMoney(report.totals.profit)} accent="forest" />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Breakdown
          title="By commodity"
          rows={report.byCommodity.map((g) => ({ label: g.label, count: g.count, value: g.profit }))}
        />
        <Breakdown
          title="By counterparty"
          rows={report.byCounterparty.map((g) => ({ label: g.label, count: g.count, value: g.profit }))}
        />
      </div>

      <h2 className="mb-3 text-sm font-medium text-ink">All owner trades</h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-tan/60 text-left">
              <Th>Reference</Th>
              <Th>Date</Th>
              <Th>Commodity</Th>
              <Th>Counterparty</Th>
              <Th>Qty</Th>
              <Th right>Revenue</Th>
              <Th right>Cost</Th>
              <Th right>Profit</Th>
            </tr>
          </thead>
          <tbody>
            {report.rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted">
                  No owner trades yet.
                </td>
              </tr>
            ) : (
              report.rows.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium text-ink">{r.reference}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(r.tradeDate)}</td>
                  <td className="px-4 py-3 text-ink">{r.commodityName}</td>
                  <td className="px-4 py-3 text-ink">{r.counterparty}</td>
                  <td className="px-4 py-3 text-ink">{formatQuantity(r.quantity, r.unit)}</td>
                  <td className="px-4 py-3 text-right text-ink">{formatMoney(r.revenue)}</td>
                  <td className="px-4 py-3 text-right text-ink">{formatMoney(r.cost)}</td>
                  <td className="px-4 py-3 text-right font-medium text-forest">{formatMoney(r.profit)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function BrokerReport() {
  const report = await brokerCommissionReport();
  return (
    <div>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Broker trades" value={String(report.totals.count)} />
        <StatCard label="Commission income" value={formatMoney(report.totals.commission)} accent="ocean" />
        <StatCard
          label="Average per trade"
          value={formatMoney(report.totals.count ? report.totals.commission / report.totals.count : 0)}
          accent="ocean"
        />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Breakdown
          title="By commodity"
          rows={report.byCommodity.map((g) => ({ label: g.label, count: g.count, value: g.commission }))}
        />
        <Breakdown
          title="By counterparty"
          rows={report.byCounterparty.map((g) => ({ label: g.label, count: g.count, value: g.commission }))}
        />
      </div>

      <h2 className="mb-3 text-sm font-medium text-ink">All broker trades</h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-tan/60 text-left">
              <Th>Reference</Th>
              <Th>Date</Th>
              <Th>Commodity</Th>
              <Th>Counterparty</Th>
              <Th>Qty</Th>
              <Th right>Commission</Th>
            </tr>
          </thead>
          <tbody>
            {report.rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No broker trades yet.
                </td>
              </tr>
            ) : (
              report.rows.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium text-ink">{r.reference}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(r.tradeDate)}</td>
                  <td className="px-4 py-3 text-ink">{r.commodityName}</td>
                  <td className="px-4 py-3 text-ink">{r.counterparty}</td>
                  <td className="px-4 py-3 text-ink">{formatQuantity(r.quantity, r.unit)}</td>
                  <td className="px-4 py-3 text-right font-medium text-ocean">{formatMoney(r.commission)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; count: number; value: number }[];
}) {
  return (
    <Card className="p-5">
      <div className="label-caps mb-3">{title}</div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">No data yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between text-sm">
              <span className="text-ink">
                {r.label} <span className="text-muted">({r.count})</span>
              </span>
              <span className="font-medium text-ink">{formatMoney(r.value)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={"px-4 py-3 label-caps font-semibold " + (right ? "text-right" : "text-left")}>{children}</th>;
}
