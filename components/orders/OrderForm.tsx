"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { Alert, Button, Card, Field, Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { createOrderAction, type FormState } from "@/app/(app)/orders/actions";

const initial: FormState = {};

export function OrderForm({ commodityNames }: { commodityNames: string[] }) {
  const [state, action] = useFormState(createOrderAction, initial);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.ok]);

  return (
    <div className="mb-6">
      <Button variant={open ? "secondary" : "primary"} onClick={() => setOpen((o) => !o)}>
        {open ? "Close" : "+ New order"}
      </Button>
      {open ? (
        <Card className="mt-4">
          <form action={action} ref={ref}>
            {state.error ? (
              <div className="mb-4">
                <Alert kind="error">{state.error}</Alert>
              </div>
            ) : null}
            <datalist id="order-commodities">
              {commodityNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            <div className="grid gap-x-4 sm:grid-cols-3">
              <Field>
                <Label htmlFor="clientName">Client</Label>
                <Input id="clientName" name="clientName" required />
              </Field>
              <Field>
                <Label htmlFor="commodityName">Commodity</Label>
                <Input id="commodityName" name="commodityName" list="order-commodities" required />
              </Field>
              <Field>
                <Label htmlFor="grade">Grade</Label>
                <Input id="grade" name="grade" />
              </Field>
              <Field>
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" step="any" min="0" required />
              </Field>
              <Field>
                <Label htmlFor="unit">Unit</Label>
                <Input id="unit" name="unit" defaultValue="MT" required />
              </Field>
              <Field>
                <Label htmlFor="agreedPrice">Agreed price (per unit)</Label>
                <Input id="agreedPrice" name="agreedPrice" type="number" step="any" min="0" required />
              </Field>
            </div>
            <SubmitButton pendingLabel="Creating...">Create order</SubmitButton>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
