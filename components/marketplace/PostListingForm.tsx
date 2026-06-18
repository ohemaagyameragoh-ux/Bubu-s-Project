"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { Alert, Button, Card, Field, Input, Label, Select } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { createListingAction, type FormState } from "@/app/(app)/marketplace/actions";

const initial: FormState = {};

export function PostListingForm({ commodityNames }: { commodityNames: string[] }) {
  const [state, action] = useFormState(createListingAction, initial);
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
        {open ? "Close" : "+ Post listing"}
      </Button>
      {open ? (
        <Card className="mt-4">
          <form action={action} ref={ref}>
            {state.error ? (
              <div className="mb-4">
                <Alert kind="error">{state.error}</Alert>
              </div>
            ) : null}
            <datalist id="mk-commodities">
              {commodityNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            <div className="grid gap-x-4 sm:grid-cols-3">
              <Field>
                <Label htmlFor="type">Type</Label>
                <Select id="type" name="type" defaultValue="SELL">
                  <option value="SELL">Sell offer</option>
                  <option value="BUY">Buy request</option>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="commodityName">Commodity</Label>
                <Input id="commodityName" name="commodityName" list="mk-commodities" required />
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
                <Label htmlFor="price">Price per unit (GHS)</Label>
                <Input id="price" name="price" type="number" step="any" min="0" required />
              </Field>
              <Field>
                <Label htmlFor="region">Region</Label>
                <Input id="region" name="region" placeholder="Tamale" />
              </Field>
            </div>
            <Field>
              <Label htmlFor="note">Note</Label>
              <Input id="note" name="note" />
            </Field>
            <SubmitButton pendingLabel="Posting...">Post listing</SubmitButton>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
