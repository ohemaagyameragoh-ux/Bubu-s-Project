import { LeadStage } from "@prisma/client";
import { listLeads } from "@/lib/services/leads";
import { formatMoney } from "@/lib/format";
import { PageHeader, StatCard } from "@/components/ui";
import { LeadBoard } from "@/components/crm/LeadBoard";

export const dynamic = "force-dynamic";

const OPEN_STAGES: LeadStage[] = [LeadStage.LEAD, LeadStage.QUOTE_SENT, LeadStage.NEGOTIATING, LeadStage.PENDING];

export default async function LeadsPage() {
  const leads = await listLeads();
  const open = leads.filter((l) => OPEN_STAGES.includes(l.stage));
  const forecast = open.reduce((a, l) => a + (l.estimatedValue ?? 0), 0);
  const won = leads.filter((l) => l.stage === LeadStage.CLOSED).reduce((a, l) => a + (l.estimatedValue ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Leads and pipeline"
        subtitle="Every request you are chasing, from WhatsApp to closed. The pipeline doubles as a sales forecast."
      />
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Open leads" value={String(open.length)} />
        <StatCard label="Pipeline value (forecast)" value={formatMoney(forecast)} accent="forest" />
        <StatCard label="Closed (won)" value={formatMoney(won)} accent="forest" />
      </div>
      <LeadBoard
        leads={leads.map((l) => ({
          id: l.id,
          clientName: l.clientName,
          commodityName: l.commodityName,
          source: l.source,
          stage: l.stage,
          estimatedValue: l.estimatedValue,
          message: l.message,
        }))}
      />
    </div>
  );
}
