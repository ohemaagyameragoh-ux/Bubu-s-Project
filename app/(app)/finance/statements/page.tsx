import { listStatements } from "@/lib/services/statements";
import { aiEnabled } from "@/lib/ai";
import { formatMoney, formatDate } from "@/lib/format";
import { Card, Badge, PageHeader, StatCard } from "@/components/ui";
import { StatementUpload } from "@/components/finance/StatementUpload";

export const dynamic = "force-dynamic";

export default async function StatementsPage() {
  const statements = await listStatements();
  const allLines = statements.flatMap((s) => s.lines);
  const flagged = allLines.filter((l) => l.flagged).length;

  return (
    <div>
      <PageHeader
        title="Statement analyzer"
        subtitle={
          aiEnabled
            ? "Upload a bank or mobile money statement. Each line is categorized by Claude and reconciled against what the system recorded."
            : "Upload a bank or mobile money statement. Each line is categorized and reconciled against what the system recorded. Connect an Anthropic API key to use Claude for sharper categories."
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Lines analyzed" value={String(allLines.length)} />
        <StatCard label="Flagged for review" value={String(flagged)} accent="clay" />
        <StatCard label="Statements" value={String(statements.length)} />
      </div>

      <div className="mb-8">
        <StatementUpload />
      </div>

      {statements.map((s) => (
        <div key={s.id} className="mb-6">
          <h2 className="mb-2 text-sm font-medium text-ink">
            {s.fileName} {s.account ? `· ${s.account}` : ""} <span className="text-muted">({formatDate(s.uploadedAt)})</span>
          </h2>
          <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-tan/60 text-left">
                  <th className="px-4 py-3 label-caps">Date</th>
                  <th className="px-4 py-3 label-caps">Description</th>
                  <th className="px-4 py-3 label-caps">Category</th>
                  <th className="px-4 py-3 label-caps text-right">Amount</th>
                  <th className="px-4 py-3 label-caps">Status</th>
                </tr>
              </thead>
              <tbody>
                {s.lines.map((l) => (
                  <tr key={l.id} className={"border-t border-line " + (l.flagged ? "bg-peach-soft/40" : "")}>
                    <td className="px-4 py-3 text-muted">{l.date ? formatDate(l.date) : "-"}</td>
                    <td className="px-4 py-3 text-ink">{l.description}</td>
                    <td className="px-4 py-3 text-ink">{l.category}</td>
                    <td className={"px-4 py-3 text-right " + (l.direction === "IN" ? "text-forest" : "text-ink")}>
                      {l.direction === "IN" ? "+" : "-"}
                      {formatMoney(l.amount)}
                    </td>
                    <td className="px-4 py-3">
                      {l.flagged ? <Badge tone="peach">flagged</Badge> : <Badge tone="green">matched</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
