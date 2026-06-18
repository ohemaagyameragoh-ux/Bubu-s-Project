"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { Alert, Button, Card, Field, Input, Label, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { createInvoiceAction, type FormState } from "@/app/(app)/invoices/actions";

let counter = 0;
const newRow = () => ({ key: counter++ });
const initial: FormState = {};

export function InvoiceForm() {
  const [state, action] = useFormState(createInvoiceAction, initial);
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
        <div className="grid gap-x-5 sm:grid-cols-3">
          <Field>
            <Label htmlFor="clientName">Client</Label>
            <Input id="clientName" name="clientName" required />
          </Field>
          <Field>
            <Label htmlFor="dueDate">Due date</Label>
            <Input id="dueDate" name="dueDate" type="date" />
          </Field>
          <Field>
            <Label htmlFor="creditTerms">Credit terms</Label>
            <Input id="creditTerms" name="creditTerms" placeholder="Net 30" />
          </Field>
        </div>
        <Field>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" />
        </Field>
      </Card>

      <Card className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="label-caps">Line items</span>
          <Button type="button" variant="secondary" onClick={() => setLines((l) => [...l, newRow()])}>
            Add line
          </Button>
        </div>
        <div className="space-y-2">
          {lines.map((row) => (
            <div key={row.key} className="grid gap-2 sm:grid-cols-[1.8fr_0.7fr_0.6fr_1fr_auto]">
              <Input name="lineDesc" placeholder="Description" />
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

      <SubmitButton pendingLabel="Creating...">Create invoice</SubmitButton>
    </form>
  );
}
