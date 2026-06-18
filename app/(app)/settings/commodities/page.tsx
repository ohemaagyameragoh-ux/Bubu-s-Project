import { listCommodities } from "@/lib/services/commodities";
import { PageHeader, Card, Badge } from "@/components/ui";
import { CommodityForm } from "@/components/settings/CommodityForm";
import { deleteCommodityAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CommoditiesPage() {
  const commodities = await listCommodities();

  return (
    <div>
      <PageHeader
        title="Commodities"
        subtitle="Set up what you trade, with the grades and units you use. Nothing is locked to one crop."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <h2 className="text-sm font-medium text-navy mb-4">Add a commodity</h2>
          <CommodityForm />
        </Card>

        <div>
          <h2 className="text-sm font-medium text-navy mb-3">Your commodities</h2>
          {commodities.length === 0 ? (
            <Card>
              <p className="text-sm text-muted">No commodities yet. Add your first one on the left.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {commodities.map((c) => (
                <Card key={c.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-navy">{c.name}</div>
                      {c.description ? <div className="text-sm text-muted mt-0.5">{c.description}</div> : null}
                    </div>
                    <form action={deleteCommodityAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-line px-2 py-1 text-xs text-red-700 hover:border-red-300"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge>base unit: {c.baseUnit}</Badge>
                    {c.units.map((u) => (
                      <Badge key={u}>{u}</Badge>
                    ))}
                  </div>
                  {c.grades.length > 0 ? (
                    <div className="mt-3 text-sm">
                      <span className="text-muted">Grades: </span>
                      {c.grades.map((g) => g.name).join(", ")}
                    </div>
                  ) : null}
                  {c.qualityParams.length > 0 ? (
                    <div className="mt-1 text-sm">
                      <span className="text-muted">Quality: </span>
                      {c.qualityParams
                        .map((q) => (q.maxAcceptable != null ? `${q.name} (max ${q.maxAcceptable}${q.unit})` : q.name))
                        .join(", ")}
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
