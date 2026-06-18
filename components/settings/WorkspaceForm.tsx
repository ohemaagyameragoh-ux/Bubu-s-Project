"use client";

import { useFormState } from "react-dom";
import { Alert, Field, Input, Label, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { updateBrandingAction, type FormState } from "@/app/(app)/settings/workspace/actions";

type Workspace = {
  name: string;
  legalName: string | null;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  currency: string;
};

const initial: FormState = {};

export function WorkspaceForm({ workspace }: { workspace: Workspace }) {
  const [state, action] = useFormState(updateBrandingAction, initial);

  return (
    <form action={action}>
      {state.error ? (
        <div className="mb-4">
          <Alert kind="error">{state.error}</Alert>
        </div>
      ) : null}
      {state.ok ? (
        <div className="mb-4">
          <Alert kind="success">Workspace details saved.</Alert>
        </div>
      ) : null}

      <div className="grid gap-x-5 sm:grid-cols-2">
        <Field>
          <Label htmlFor="name">Business name</Label>
          <Input id="name" name="name" defaultValue={workspace.name} required />
        </Field>
        <Field>
          <Label htmlFor="legalName">Legal name</Label>
          <Input id="legalName" name="legalName" defaultValue={workspace.legalName ?? ""} />
        </Field>
        <Field>
          <Label htmlFor="email">Contact email</Label>
          <Input id="email" name="email" type="email" defaultValue={workspace.email ?? ""} />
        </Field>
        <Field>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={workspace.phone ?? ""} />
        </Field>
        <Field>
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input id="logoUrl" name="logoUrl" defaultValue={workspace.logoUrl ?? ""} placeholder="https://..." />
        </Field>
        <Field>
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" name="currency" defaultValue={workspace.currency} placeholder="USD" />
        </Field>
      </div>
      <Field>
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" name="address" defaultValue={workspace.address ?? ""} />
      </Field>

      <SubmitButton pendingLabel="Saving...">Save changes</SubmitButton>
    </form>
  );
}
