"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import type { CounterpartyType } from "@prisma/client";
import { Alert, Card, Field, Input, Label, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { addCounterpartyAction, deleteCounterpartyAction, type FormState } from "@/app/(app)/counterparty-actions";

type Row = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  location: string | null;
  notes: string;
};

const initial: FormState = {};

export function CounterpartyPanel({
  type,
  rows,
  addLabel,
}: {
  type: CounterpartyType;
  rows: Row[];
  addLabel: string;
}) {
  const [state, action] = useFormState(addCounterpartyAction, initial);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <Card>
        <h2 className="mb-4 text-sm font-medium text-ink">{addLabel}</h2>
        <form action={action} ref={ref}>
          <input type="hidden" name="type" value={type} />
          {state.error ? (
            <div className="mb-4">
              <Alert kind="error">{state.error}</Alert>
            </div>
          ) : null}
          {state.ok ? (
            <div className="mb-4">
              <Alert kind="success">Saved.</Alert>
            </div>
          ) : null}
          <Field>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </Field>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" />
            </Field>
            <Field>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </Field>
          </div>
          <Field>
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" />
          </Field>
          <Field>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" />
          </Field>
          <SubmitButton pendingLabel="Saving...">Save</SubmitButton>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-medium text-ink">{rows.length} records</h2>
        {rows.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">Nothing here yet. Add your first record on the left.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-ink">{r.name}</div>
                    <div className="mt-0.5 text-sm text-muted">
                      {[r.phone, r.email, r.location].filter(Boolean).join(" · ") || "No contact details"}
                    </div>
                    {r.notes ? <div className="mt-1 text-sm text-ink">{r.notes}</div> : null}
                  </div>
                  <form action={deleteCounterpartyAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="rounded-md border border-line px-2 py-1 text-xs text-clay-dark hover:border-clay/40">
                      Delete
                    </button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
