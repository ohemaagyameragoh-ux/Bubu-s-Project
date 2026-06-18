import { LotStatus } from "@prisma/client";
import { listLots } from "@/lib/services/inventory";
import { PageHeader } from "@/components/ui";
import { NewTripForm, type LotOption } from "@/components/logistics/NewTripForm";

export const dynamic = "force-dynamic";

export default async function NewTripPage() {
  const lots = await listLots();
  const available: LotOption[] = lots
    .filter((l) => l.status !== LotStatus.DISPATCHED && l.remainingWeight > 0)
    .map((l) => ({
      id: l.id,
      reference: l.reference,
      commodityName: l.commodityName,
      grade: l.grade,
      remainingWeight: l.remainingWeight,
      unit: l.unit,
      createdAt: l.createdAt.toISOString(),
    }));

  return (
    <div>
      <PageHeader eyebrow="New trip" title="Dispatch a truck" subtitle="Choose the lots to load (oldest first), record the weighbridge and seal, and generate a waybill." />
      <NewTripForm lots={available} />
    </div>
  );
}
