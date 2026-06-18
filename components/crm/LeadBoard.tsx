"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import type { LeadStage } from "@prisma/client";
import { Alert, Button, Card, Field, Input, Label, Select } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { formatMoney } from "@/lib/format";
import { createLeadAction, moveLeadAction, deleteLeadAction, type FormState } from "@/app/(app)/leads/actions";

export type LeadRow = {
  id: string;
  clientName: string;
  commodityName: string | null;
  source: string;
  stage: LeadStage;
  estimatedValue: number | null;
  message: string;
};

const STAGES: { key: LeadStage; label: string }[] = [
  { key: "LEAD", label: "New lead" },
  { key: "QUOTE_SENT", label: "Quote sent" },
  { key: "NEGOTIATING", label: "Negotiating" },
  { key: "PENDING", label: "Pending" },
  { key: "CLOSED", label: "Closed (won)" },
  { key: "LOST", label: "Lost" },
];

const initial: FormState = {};

export function LeadBoard({ leads }: { leads: LeadRow[] }) {
  const [state, action] = useFormState(createLeadAction, initial);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.ok]);

  return (
    <div>
      <div className="mb-5">
        <Button variant={open ? "secondary" : "primary"} onClick={() => setOpen((o) => !o)}>
          {open ? "Close" : "+ New lead"}
        </Button>
      </div>

      {open ? (
        <Card className="mb-6">
          <form action={action} ref={ref}>
            {state.error ? (
              <div className="mb-4">
                <Alert kind="error">{state.error}</Alert>
              </div>
            ) : null}
            <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field>
                <Label htmlFor="clientName">Client</Label>
                <Input id="clientName" name="clientName" required />
              </Field>
              <Field>
                <Label htmlFor="commodityName">Commodity</Label>
                <Input id="commodityName" name="commodityName" placeholder="Maize" />
              </Field>
              <Field>
                <Label htmlFor="source">Source</Label>
                <Select id="source" name="source" defaultValue="WHATSAPP">
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EMAIL">Email</option>
                  <option value="PHONE">Phone</option>
                  <option value="WALK_IN">Walk in</option>
                  <option value="OTHER">Other</option>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="estimatedValue">Estimated value (GHS)</Label>
                <Input id="estimatedValue" name="estimatedValue" type="number" step="any" min="0" />
              </Field>
            </div>
            <Field>
              <Label htmlFor="message">Message or note</Label>
              <Input id="message" name="message" placeholder="Wants 50 MT maize, Grade A, for June" />
            </Field>
            <SubmitButton pendingLabel="Saving...">Save lead</SubmitButton>
          </form>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {STAGES.map((stage) => {
          const rows = leads.filter((l) => l.stage === stage.key);
          const value = rows.reduce((a, l) => a + (l.estimatedValue ?? 0), 0);
          return (
            <div key={stage.key} className="rounded-2xl border border-line bg-paper/60 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-sm font-medium text-ink">{stage.label}</span>
                <span className="text-xs text-muted">
                  {rows.length} · {formatMoney(value)}
                </span>
              </div>
              <div className="space-y-2">
                {rows.map((l) => (
                  <div key={l.id} className="rounded-xl border border-line bg-card p-3 shadow-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-ink">{l.clientName}</div>
                      {l.estimatedValue ? (
                        <div className="text-sm font-medium text-forest">{formatMoney(l.estimatedValue)}</div>
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-xs text-muted">
                      {[l.commodityName, l.source.toLowerCase()].filter(Boolean).join(" · ")}
                    </div>
                    {l.message ? <div className="mt-2 text-sm text-ink">{l.message}</div> : null}
                    <div className="mt-3 flex items-center gap-2">
                      <form action={moveLeadAction} className="flex-1">
                        <input type="hidden" name="id" value={l.id} />
                        <select
                          name="stage"
                          defaultValue={l.stage}
                          onChange={(e) => e.currentTarget.form?.requestSubmit()}
                          className="w-full rounded-lg border border-line bg-white px-2 py-1 text-xs"
                        >
                          {STAGES.map((s) => (
                            <option key={s.key} value={s.key}>
                              Move to: {s.label}
                            </option>
                          ))}
                        </select>
                      </form>
                      <form action={deleteLeadAction}>
                        <input type="hidden" name="id" value={l.id} />
                        <button className="rounded-lg border border-line px-2 py-1 text-xs text-clay-dark hover:border-clay/40">
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
                {rows.length === 0 ? <div className="px-1 py-3 text-xs text-muted">Empty</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
