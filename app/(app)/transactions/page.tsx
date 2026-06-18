import Link from "next/link";
import { TradeMode, Lifecycle } from "@prisma/client";
import { listTransactions, type TransactionFilters } from "@/lib/services/transactions";
import { listCommodities } from "@/lib/services/commodities";
import { Button, Card } from "@/components/ui";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";

export const dynamic = "force-dynamic";

type SearchParams = {
  commodityId?: string;
  mode?: string;
  status?: string;
  counterparty?: string;
  from?: string;
  to?: string;
};

function parseFilters(sp: SearchParams): TransactionFilters {
  const filters: TransactionFilters = {};
  if (sp.commodityId) filters.commodityId = sp.commodityId;
  if (sp.mode && sp.mode in TradeMode) filters.mode = sp.mode as TradeMode;
  if (sp.status && sp.status in Lifecycle) filters.status = sp.status as Lifecycle;
  if (sp.counterparty) filters.counterparty = sp.counterparty;
  if (sp.from) filters.from = new Date(sp.from);
  if (sp.to) filters.to = new Date(sp.to);
  return filters;
}

const fieldClass =
  "rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-clay/50";

export default async function TransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseFilters(searchParams);
  const [rows, commodities] = await Promise.all([listTransactions(filters), listCommodities()]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">All transactions</h1>
          <p className="mt-2 text-muted">Every deal you have recorded, owned or brokered.</p>
        </div>
        <Link href="/transactions/new" className="no-underline">
          <Button>
            <span className="text-base leading-none">+</span> New transaction
          </Button>
        </Link>
      </div>

      <Card className="mb-6 p-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label-caps mb-1 block">Commodity</label>
            <select name="commodityId" defaultValue={searchParams.commodityId ?? ""} className={fieldClass}>
              <option value="">All</option>
              {commodities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-caps mb-1 block">Role</label>
            <select name="mode" defaultValue={searchParams.mode ?? ""} className={fieldClass}>
              <option value="">All</option>
              <option value="OWNER">Owner-Trader</option>
              <option value="BROKER">Broker</option>
            </select>
          </div>
          <div>
            <label className="label-caps mb-1 block">Status</label>
            <select name="status" defaultValue={searchParams.status ?? ""} className={fieldClass}>
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="label-caps mb-1 block">Counterparty</label>
            <input name="counterparty" defaultValue={searchParams.counterparty ?? ""} className={fieldClass} placeholder="Name" />
          </div>
          <div>
            <label className="label-caps mb-1 block">From</label>
            <input type="date" name="from" defaultValue={searchParams.from ?? ""} className={fieldClass} />
          </div>
          <div>
            <label className="label-caps mb-1 block">To</label>
            <input type="date" name="to" defaultValue={searchParams.to ?? ""} className={fieldClass} />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="secondary">
              Apply
            </Button>
            <Link href="/transactions" className="text-sm text-muted no-underline hover:text-ink">
              Clear
            </Link>
          </div>
        </form>
      </Card>

      <p className="mb-3 text-sm text-muted">
        {rows.length} {rows.length === 1 ? "trade" : "trades"}. Change payment, delivery, or lifecycle inline below.
      </p>
      <TransactionsTable rows={rows} editable emptyHint="No trades match these filters." />
    </div>
  );
}
