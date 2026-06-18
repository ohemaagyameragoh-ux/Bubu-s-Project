"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { Alert, Button, Card, Field, Input, Label, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { createQuoteAction, type FormState } from "@/app/(app)/quotes/actions";

let counter = 0;
const newRow = () => ({ key: counter++ });
const initial: FormState = {};

export function QuoteForm({ commodityNames }: { commodityNames: string[] }) {
  const [state, action] = useFormState(createQuoteAction, initial);
  const [lines, setLines] = useState([newRow()]);

  return (
    <form action={action}>
      {state.error ? (
        <div className="mb-5">
          <Alert kind="error">{state.error}</Alert>
        </div>
      ) : null}

      <Card className="mb-6">
        <div className="label-caps mb-4">Client and terms</div>
        <div className="grid gap-x-5 sm:grid-cols-2">
          <Field>
            <Label htmlFor="clientName">Client</Label>
            <Input id="clientName" name="clientName" required placeholder="Accra Grain Mills Ltd" />
          </Field>
          <Field>
            <Label htmlFor="validUntil">Valid until</Label>
            <Input id="validUntil" name="validUntil" type="date" />
          </Field>
        </div>
        <Field>
          <Label htmlFor="deliveryTerms">Delivery terms</Label>
          <Input id="deliveryTerms" name="deliveryTerms" placeholder="Delivered to client warehouse, Accra" />
        </Field>
        <Field>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" />
        </Field>
      </Card>

      <Card className="mb-6">
        <datalist id="commodity-names">
          {commodityNames.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
        <div className="mb-3 flex items-center justify-between">
          <span className="label-caps">Line items</span>
          <Button type="button" variant="secondary" onClick={() => setLines((l) => [...l, newRow()])}>
            Add line
          </Button>
        </div>
        <div className="space-y-2">
          {lines.map((row) => (
            <div key={row.key} className="grid gap-2 sm:grid-cols-[1.4fr_1fr_0.8fr_0.7fr_1fr_auto]">
              <Input name="lineCommodity" list="commodity-names" placeholder="Commodity" />
              <Input name="lineGrade" placeholder="Grade" />
              <Input name="lineQty" type="number" step="any" min="0" placeholder="Qty" />
              <Input name="lineUnit" placeholder="Unit" defaultValue="MT" />
              <Input name="linePrice" type="number" step="any" min="0" placeholder="Unit price" />
              <Button
                type="button"
                variant="danger"
                onClick={() => setLines((l) => (l.length > 1 ? l.filter((r) => r.key !== row.key) : l))}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <SubmitButton pendingLabel="Creating...">Create quote</SubmitButton>
    </form>
  );
}
