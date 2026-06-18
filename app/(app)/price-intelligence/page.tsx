import Link from "next/link";
import { listPricedCommodities, priceIntelligence } from "@/lib/services/pricing";
import { formatMoney } from "@/lib/format";
import { Card, PageHeader, Badge } from "@/components/ui";
import { PriceChart } from "@/components/finance/PriceChart";

export const dynamic = "force-dynamic";

export default async function PriceIntelligencePage({ searchParams }: { searchParams: { c?: string } }) {
  const commodities = await listPricedCommodities();
  const selected = searchParams.c && commodities.includes(searchParams.c) ? searchParams.c : commodities[0];

  if (!selected) {
    return (
      <div>
        <PageHeader title="Price intelligence" subtitle="Historic trends and AI-assisted forecasts, never a guarantee." />
        <Card>
          <p className="text-muted">Set up a commodity first to see price intelligence.</p>
        </Card>
      </div>
    );
  }

  const data = await priceIntelligence(selected);

  return (
    <div>
      <PageHeader title="Price intelligence" subtitle="Historic trends and AI-assisted forecasts, never a guarantee." />

      <div className="mb-6 flex flex-wrap gap-2">
        {commodities.map((c) => (
          <Link
            key={c}
            href={`/price-intelligence?c=${encodeURIComponent(c)}`}
            className={
              "rounded-full px-4 py-2 text-sm font-medium no-underline " +
              (c === selected ? "bg-clay text-white" : "border border-line bg-white text-ink hover:border-clay/40")
            }
          >
            {c}
          </Link>
        ))}
      </div>

      <Card className="mb-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="label-caps">{selected}</div>
            <div className="mt-1 font-display text-3xl font-semibold text-ink">
              {formatMoney(data.latest)}{" "}
              <span className={"text-base " + (data.changePct >= 0 ? "text-forest" : "text-clay")}>
                {data.changePct >= 0 ? "+" : ""}
                {data.changePct.toFixed(1)}%
              </span>
            </div>
          </div>
          <Badge tone="peach">Confidence: {data.confidence}</Badge>
        </div>
        <PriceChart history={data.history} forecast={data.forecast} />
      </Card>

      <Card>
        <div className="label-caps mb-2">AI insight</div>
        <p className="text-ink">{data.insight}</p>
        <p className="mt-3 text-xs text-muted">
          Forecasts show a confidence level and are estimates only. They are not a guarantee. Always apply your own
          judgement before buying or selling.
        </p>
      </Card>
    </div>
  );
}
