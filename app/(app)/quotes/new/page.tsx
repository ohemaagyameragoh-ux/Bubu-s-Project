import { listCommodities } from "@/lib/services/commodities";
import { PageHeader } from "@/components/ui";
import { QuoteForm } from "@/components/quotes/QuoteForm";

export const dynamic = "force-dynamic";

export default async function NewQuotePage() {
  const commodities = await listCommodities();
  return (
    <div>
      <PageHeader eyebrow="New quote" title="Build a quote" subtitle="Add line items and terms. You can download a branded document and send it to the client." />
      <QuoteForm commodityNames={commodities.map((c) => c.name)} />
    </div>
  );
}
