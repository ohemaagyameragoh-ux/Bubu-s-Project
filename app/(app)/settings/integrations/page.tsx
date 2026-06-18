import { IntegrationKind } from "@prisma/client";
import { listIntegrations } from "@/lib/services/integrations";
import { PageHeader } from "@/components/ui";
import { IntegrationCard } from "@/components/settings/IntegrationCard";

export const dynamic = "force-dynamic";

const KINDS: { kind: IntegrationKind; title: string; description: string; credentialLabel: string }[] = [
  { kind: IntegrationKind.WHATSAPP, title: "WhatsApp", description: "Incoming client requests become leads. Send quotes, delivery updates, and reminders.", credentialLabel: "Business number or token" },
  { kind: IntegrationKind.EMAIL, title: "Email", description: "Send quotes, delivery reports, and invoices from your own address.", credentialLabel: "Sender address or API key" },
  { kind: IntegrationKind.MOBILE_MONEY, title: "Mobile money", description: "Pay farmers and receive client payments. The system never sends a payment on its own.", credentialLabel: "Merchant ID or API key" },
  { kind: IntegrationKind.BANK, title: "Bank", description: "Receive client payments and feed the statement analyzer.", credentialLabel: "Account or API key" },
  { kind: IntegrationKind.PRICE_FEED, title: "Price feed", description: "Optional outside price data to enrich your price history.", credentialLabel: "Feed API key" },
];

export default async function IntegrationsPage() {
  const records = await listIntegrations();
  const byKind = new Map(records.map((r) => [r.kind, r]));

  return (
    <div>
      <PageHeader
        title="Integrations"
        subtitle="Connect your own accounts. Nothing is shared between workspaces, and no payment is ever sent without an explicit action."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {KINDS.map((k) => {
          const rec = byKind.get(k.kind);
          const config = (rec?.config ?? null) as { credential?: string } | null;
          return (
            <IntegrationCard
              key={k.kind}
              kind={k.kind}
              title={k.title}
              description={k.description}
              credentialLabel={k.credentialLabel}
              existing={
                rec
                  ? { label: rec.label, connected: rec.connected, credential: config?.credential ?? "" }
                  : null
              }
            />
          );
        })}
      </div>
    </div>
  );
}
