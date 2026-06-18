import { CounterpartyType } from "@prisma/client";
import { listCounterparties } from "@/lib/services/counterparties";
import { PageHeader } from "@/components/ui";
import { CounterpartyPanel } from "@/components/crm/CounterpartyPanel";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const rows = await listCounterparties(CounterpartyType.CLIENT);
  return (
    <div>
      <PageHeader title="Clients" subtitle="The buyers you sell to. Leads and quotes are logged against these records." />
      <CounterpartyPanel type={CounterpartyType.CLIENT} addLabel="Add a client" rows={rows} />
    </div>
  );
}
