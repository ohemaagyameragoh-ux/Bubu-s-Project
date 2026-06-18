import { Card, PageHeader, Badge } from "@/components/ui";

// A consistent placeholder for features that belong to a later milestone. It shows what is
// coming so the navigation matches the full product vision without pretending the data exists.
export function ComingSoon({
  title,
  subtitle,
  milestone,
  features,
}: {
  title: string;
  subtitle: string;
  milestone: string;
  features: string[];
}) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} action={<Badge tone="peach">{milestone}</Badge>} />
      <Card>
        <div className="label-caps mb-3">Planned for this area</div>
        <ul className="space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-ink">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-muted">
          This screen is part of a later milestone. The core trade recording, dashboard, and reports
          are live now.
        </p>
      </Card>
    </div>
  );
}
