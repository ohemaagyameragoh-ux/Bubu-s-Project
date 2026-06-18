"use client";

import { useFormState } from "react-dom";
import type { IntegrationKind } from "@prisma/client";
import { Alert, Card, Field, Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { upsertIntegrationAction, type FormState } from "@/app/(app)/settings/integrations/actions";

const initial: FormState = {};

export function IntegrationCard({
  kind,
  title,
  description,
  credentialLabel,
  existing,
}: {
  kind: IntegrationKind;
  title: string;
  description: string;
  credentialLabel: string;
  existing: { label: string; connected: boolean; credential: string } | null;
}) {
  const [state, action] = useFormState(upsertIntegrationAction, initial);

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium text-ink">{title}</div>
          <div className="mt-0.5 text-sm text-muted">{description}</div>
        </div>
        <span
          className={
            "rounded-full px-2 py-0.5 text-xs " +
            (existing?.connected ? "bg-green-soft text-forest-dark" : "bg-paper text-muted")
          }
        >
          {existing?.connected ? "Connected" : "Not connected"}
        </span>
      </div>

      <form action={action} className="mt-4">
        <input type="hidden" name="kind" value={kind} />
        {state.error ? (
          <div className="mb-3">
            <Alert kind="error">{state.error}</Alert>
          </div>
        ) : null}
        {state.ok ? (
          <div className="mb-3">
            <Alert kind="success">Saved.</Alert>
          </div>
        ) : null}
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field>
            <Label htmlFor={`${kind}-label`}>Account label</Label>
            <Input id={`${kind}-label`} name="label" defaultValue={existing?.label ?? ""} placeholder="My business account" />
          </Field>
          <Field>
            <Label htmlFor={`${kind}-cred`}>{credentialLabel}</Label>
            <Input id={`${kind}-cred`} name="credential" defaultValue={existing?.credential ?? ""} />
          </Field>
        </div>
        <label className="mb-4 flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="connected" defaultChecked={existing?.connected ?? false} className="h-4 w-4" />
          Mark as connected
        </label>
        <SubmitButton pendingLabel="Saving...">Save</SubmitButton>
      </form>
    </Card>
  );
}
