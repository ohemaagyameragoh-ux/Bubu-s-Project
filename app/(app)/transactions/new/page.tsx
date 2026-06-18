import Link from "next/link";
import { listCommodities } from "@/lib/services/commodities";
import { PageHeader, Card, Button } from "@/components/ui";
import { RecordTransactionForm, type CommodityOption } from "@/components/transactions/RecordTransactionForm";

export const dynamic = "force-dynamic";

export default async function NewTransactionPage() {
  const commodities = await listCommodities();

  const options: CommodityOption[] = commodities.map((c) => ({
    id: c.id,
    name: c.name,
    baseUnit: c.baseUnit,
    units: c.units,
    grades: c.grades.map((g) => ({ id: g.id, name: g.name })),
  }));

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader eyebrow="New transaction" title="Record a trade" subtitle="Capture a trade as an owner-trader or a broker. The fields adjust to the role you pick." />

      {options.length === 0 ? (
        <Card>
          <p className="text-muted">
            You need at least one commodity before recording a trade. Set up what you trade first.
          </p>
          <div className="mt-4">
            <Link href="/settings/commodities">
              <Button>Add a commodity</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <RecordTransactionForm commodities={options} today={today} />
      )}
    </div>
  );
}
