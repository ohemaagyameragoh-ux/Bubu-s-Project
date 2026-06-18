import Link from "next/link";
import { Lifecycle, TradeMode } from "@prisma/client";
import { requireTenantUser } from "@/lib/session";
import { listTransactions } from "@/lib/services/transactions";
import { ownerProfit } from "@/lib/transaction-status";
import { formatLongDate, formatMoney } from "@/lib/format";
import { Button, StatCard } from "@/components/ui";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";

export const dynamic = "force-dynamic";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const TABS = [
  { key: "active", label: "Active", status: Lifecycle.ACTIVE },
  { key: "pending", label: "Pending", status: Lifecycle.PENDING },
  { key: "completed", label: "Completed", status: Lifecycle.COMPLETED },
] as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const user = await requireTenantUser();
  const all = await listTransactions();

  const firstName = user.name.split(" ")[0] || user.name;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const active = all.filter((t) => t.status === Lifecycle.ACTIVE);
  const pending = all.filter((t) => t.status === Lifecycle.PENDING);
  const completed = all.filter((t) => t.status === Lifecycle.COMPLETED);

  const qtyInMotion = active.reduce((sum, t) => sum + t.quantity, 0);

  const mtdProfit = all
    .filter((t) => t.mode === TradeMode.OWNER && t.tradeDate >= monthStart)
    .reduce((sum, t) => sum + ownerProfit(t.quantity, t.buyPrice, t.sellPrice).profit, 0);

  const mtdCommission = all
    .filter((t) => t.mode === TradeMode.BROKER && t.tradeDate >= monthStart)
    .reduce((sum, t) => sum + (t.commission ?? 0), 0);

  const activeTab = TABS.find((t) => t.key === searchParams.tab) ?? TABS[0];
  const tabRows = { active, pending, completed }[activeTab.key].slice(0, 10);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="label-caps mb-2">{formatLongDate(now)}</div>
          <h1 className="font-display text-4xl font-semibold text-ink">
            {greeting()}, {firstName}
          </h1>
        </div>
        <Link href="/transactions/new" className="no-underline">
          <Button>
            <span className="text-base leading-none">+</span> New transaction
          </Button>
        </Link>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active deals"
          value={String(active.length)}
          sub={`${qtyInMotion.toLocaleString("en-US", { maximumFractionDigits: 0 })} units in motion`}
        />
        <StatCard label="Pending" value={String(pending.length)} sub="Awaiting first action" />
        <StatCard label="Trading P&L (MTD)" value={formatMoney(mtdProfit)} sub="Owner-Trader role" accent="forest" />
        <StatCard label="Commission income (MTD)" value={formatMoney(mtdCommission)} sub="Broker role" accent="ocean" />
      </div>

      <div className="mb-4 flex items-center gap-6 border-b border-line">
        {TABS.map((tab) => {
          const count = { active, pending, completed }[tab.key].length;
          const isActive = tab.key === activeTab.key;
          return (
            <Link
              key={tab.key}
              href={`/dashboard?tab=${tab.key}`}
              className={
                "no-underline -mb-px border-b-2 px-1 pb-3 text-sm font-medium " +
                (isActive ? "border-clay text-ink" : "border-transparent text-muted hover:text-ink")
              }
            >
              {tab.label} <span className="text-muted">({count})</span>
            </Link>
          );
        })}
      </div>

      <TransactionsTable rows={tabRows} emptyHint={`No ${activeTab.label.toLowerCase()} trades right now.`} />
    </div>
  );
}
