import { CounterpartyType } from "@prisma/client";
import { listCounterparties } from "@/lib/services/counterparties";
import { PageHeader } from "@/components/ui";
import { CounterpartyPanel } from "@/components/crm/CounterpartyPanel";

export const dynamic = "force-dynamic";

export default async function FarmersPage() {
  const rows = await listCounterparties(CounterpartyType.FARMER);
  return (
    <div>
      <PageHeader title="Farmers" subtitle="The suppliers you aggregate from. Field purchases are recorded against these records." />
      <CounterpartyPanel type={CounterpartyType.FARMER} addLabel="Add a farmer" rows={rows} />
    </div>
  );
}
