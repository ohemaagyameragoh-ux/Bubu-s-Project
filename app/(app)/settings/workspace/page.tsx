import { getWorkspace } from "@/lib/services/workspace";
import { PageHeader, Card } from "@/components/ui";
import { WorkspaceForm } from "@/components/settings/WorkspaceForm";

export const dynamic = "force-dynamic";

export default async function WorkspaceSettingsPage() {
  const workspace = await getWorkspace();
  return (
    <div>
      <PageHeader
        title="Workspace"
        subtitle="Your company details and branding. These appear on every quote, invoice, and report you generate."
      />
      <Card>
        <WorkspaceForm workspace={workspace} />
      </Card>
    </div>
  );
}
